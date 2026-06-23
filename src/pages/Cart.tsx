import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2, ShoppingCart, IndianRupee, Minus, Plus, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!user) { toast.error("Please login first"); return; }
    if (!address.trim()) { toast.error("Please enter shipping address"); return; }
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    setPlacing(true);
    // Server-authoritative checkout — prices are re-fetched on the backend
    const { data, error } = await supabase.functions.invoke("place-order", {
      body: {
        shipping_address: address,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Failed to place order");
      setPlacing(false);
      return;
    }

    clearCart();
    toast.success("Order placed successfully!");
    navigate("/orders");
    setPlacing(false);
  };

  if (items.length === 0) {
    return (
      <div className="container py-10 text-center">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Your Cart is Empty</h1>
        <p className="mt-2 text-muted-foreground">Browse the marketplace and add products.</p>
        <Link to="/marketplace">
          <Button className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">₹{item.price}/{item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-display font-bold text-primary w-20 text-right">₹{(item.price * item.quantity).toFixed(0)}</p>
                <Button size="sm" variant="ghost" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle className="font-display">Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{i.name} × {i.quantity}</span>
                  <span>₹{(i.price * i.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 flex justify-between font-display text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(0)}</span>
            </div>
            <div>
              <Label>Shipping Address</Label>
              <Textarea placeholder="Enter your full address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1.5" />
            </div>
            <Button className="w-full" onClick={handleCheckout} disabled={placing}>
              {placing ? "Placing Order..." : "Place Order"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
