import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, IndianRupee } from "lucide-react";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const statusColor: Record<string, string> = {
    pending: "bg-warning/20 text-warning-foreground",
    confirmed: "bg-primary/10 text-primary",
    shipped: "bg-accent/20 text-accent-foreground",
    delivered: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">My Orders</h1>
      <p className="mt-2 text-muted-foreground">Track your order history and status.</p>

      <div className="mt-8 space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No orders yet. Start shopping!</p>
          </div>
        ) : (
          orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">
                      Order #{o.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={statusColor[o.status] || ""} variant="secondary">
                      {o.status}
                    </Badge>
                    <p className="mt-1 font-display font-bold text-primary">₹{Number(o.total).toFixed(0)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {o.order_items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span>{item.products?.name || "Product"} × {item.quantity}</span>
                      <span>₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                {o.shipping_address && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    📍 {o.shipping_address}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
