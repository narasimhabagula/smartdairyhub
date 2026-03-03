import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, IndianRupee } from "lucide-react";

const cattle = [
  { id: 1, name: "HF Cross Cow", breed: "Holstein Friesian Cross", type: "Cow", milkYield: "18 L/day", price: 85000, age: "3 years", location: "Pune, MH", seller: "Ravi Patil", phone: "+91 98765 43210", status: "sell" },
  { id: 2, name: "Murrah Buffalo", breed: "Murrah", type: "Buffalo", milkYield: "14 L/day", price: 120000, age: "4 years", location: "Karnal, HR", seller: "Sukhdev Singh", phone: "+91 99887 65432", status: "sell" },
  { id: 3, name: "Gir Cow", breed: "Gir", type: "Cow", milkYield: "12 L/day", price: 65000, age: "2.5 years", location: "Junagadh, GJ", seller: "Bhavesh Patel", phone: "+91 97654 32100", status: "sell" },
  { id: 4, name: "Jersey Cross Cow", breed: "Jersey Cross", type: "Cow", milkYield: "15 L/day", price: 70000, age: "3.5 years", location: "Kolhapur, MH", seller: "Anil More", phone: "+91 98123 45678", status: "sell" },
  { id: 5, name: "Jaffarabadi Buffalo", breed: "Jaffarabadi", type: "Buffalo", milkYield: "10 L/day", price: 95000, age: "5 years", location: "Amreli, GJ", seller: "Karan Sinh", phone: "+91 94567 89012", status: "buy" },
  { id: 6, name: "Sahiwal Cow", breed: "Sahiwal", type: "Cow", milkYield: "10 L/day", price: 55000, age: "2 years", location: "Fazilka, PB", seller: "Gurpreet Kaur", phone: "+91 93456 78901", status: "buy" },
];

export default function CattleMarket() {
  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Cattle Market</h1>
      <p className="mt-2 text-muted-foreground">Buy and sell cows & buffaloes from trusted farmers across India.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cattle.map((c) => (
          <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-display text-lg">{c.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{c.breed}</p>
                </div>
                <Badge variant={c.status === "sell" ? "default" : "secondary"}>
                  {c.status === "sell" ? "For Sale" : "Wanted"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {c.type}</div>
                <div><span className="text-muted-foreground">Age:</span> {c.age}</div>
                <div><span className="text-muted-foreground">Milk:</span> {c.milkYield}</div>
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3 text-muted-foreground" />
                  <span className="font-semibold text-primary">{c.price.toLocaleString("en-IN")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {c.location}
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm font-medium">{c.seller}</span>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
