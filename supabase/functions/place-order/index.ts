// Server-authoritative checkout: re-reads product prices and computes totals
// to prevent client-side price tampering. Atomically decrements stock.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InItem { product_id: string; quantity: number }
interface Body { items: InItem[]; shipping_address: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user with their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const body = (await req.json()) as Body;
    const shipping = String(body?.shipping_address ?? "").trim();
    if (!shipping) return json({ error: "Shipping address required" }, 400);
    if (shipping.length > 500) return json({ error: "Shipping address too long" }, 400);

    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) return json({ error: "Cart is empty" }, 400);
    if (items.length > 100) return json({ error: "Too many items" }, 400);

    // Validate + dedupe
    const wanted = new Map<string, number>();
    for (const it of items) {
      const pid = String(it?.product_id ?? "");
      const qty = Number(it?.quantity);
      if (!pid || !Number.isInteger(qty) || qty <= 0 || qty > 1000) {
        return json({ error: "Invalid item" }, 400);
      }
      wanted.set(pid, (wanted.get(pid) ?? 0) + qty);
    }

    // Service role to fetch authoritative prices, bypassing any RLS surprises
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const ids = [...wanted.keys()];
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, price, stock, approved")
      .in("id", ids);
    if (prodErr) {
      console.error("place-order: failed to load products", prodErr);
      return json({ error: "Failed to load products" }, 500);
    }
    if (!products || products.length !== ids.length) {
      return json({ error: "One or more products not found" }, 400);
    }

    let total = 0;
    const orderItemsPayload: { product_id: string; quantity: number; price: number }[] = [];
    for (const p of products) {
      if (!p.approved) return json({ error: "Product not available" }, 400);
      const qty = wanted.get(p.id)!;
      if ((p.stock ?? 0) < qty) return json({ error: "Insufficient stock" }, 400);
      const price = Number(p.price);
      total += price * qty;
      orderItemsPayload.push({ product_id: p.id, quantity: qty, price });
    }

    // Atomically decrement stock for each product via SECURITY DEFINER RPC
    // that uses SELECT ... FOR UPDATE. Roll back any successful decrements
    // if a later product cannot be decremented.
    const decremented: { id: string; qty: number }[] = [];
    for (const item of orderItemsPayload) {
      const { data: ok, error: decErr } = await admin.rpc("decrement_product_stock", {
        _product_id: item.product_id,
        _qty: item.quantity,
      });
      if (decErr || ok !== true) {
        // Roll back already-decremented items
        for (const d of decremented) {
          await admin.rpc("decrement_product_stock", { _product_id: d.id, _qty: -d.qty }).catch(
            (e) => console.error("place-order: rollback failed", e),
          );
        }
        if (decErr) console.error("place-order: decrement failed", decErr);
        return json({ error: "Insufficient stock" }, 400);
      }
      decremented.push({ id: item.product_id, qty: item.quantity });
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({ buyer_id: userId, total, shipping_address: shipping })
      .select()
      .single();
    if (orderErr || !order) {
      // Restore stock on failure
      for (const d of decremented) {
        await admin.rpc("decrement_product_stock", { _product_id: d.id, _qty: -d.qty }).catch(
          (e) => console.error("place-order: rollback failed", e),
        );
      }
      console.error("place-order: order insert failed", orderErr);
      return json({ error: "Failed to create order" }, 500);
    }

    const { error: itemsErr } = await admin
      .from("order_items")
      .insert(orderItemsPayload.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) {
      await admin.from("orders").delete().eq("id", order.id);
      for (const d of decremented) {
        await admin.rpc("decrement_product_stock", { _product_id: d.id, _qty: -d.qty }).catch(
          (e) => console.error("place-order: rollback failed", e),
        );
      }
      console.error("place-order: order items insert failed", itemsErr);
      return json({ error: "Failed to save order items" }, 500);
    }

    return json({ order_id: order.id, total }, 200);
  } catch (e) {
    console.error("place-order: unexpected error", e);
    return json({ error: "An unexpected error occurred. Please try again." }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
