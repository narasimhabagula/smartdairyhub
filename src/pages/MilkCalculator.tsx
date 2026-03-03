import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";

export default function MilkCalculator() {
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [liters, setLiters] = useState("");
  const [animalType, setAnimalType] = useState("cow");
  const [result, setResult] = useState<{ rate: number; total: number } | null>(null);

  const calculate = () => {
    const f = parseFloat(fat);
    const s = parseFloat(snf);
    const l = parseFloat(liters);
    if (isNaN(f) || isNaN(s) || isNaN(l)) return;

    // Standard Indian dairy rate formula
    const baseRate = animalType === "buffalo" ? 8.0 : 6.5;
    const rate = f * baseRate + s * 0.36;
    const total = rate * l;
    setResult({ rate: Math.round(rate * 100) / 100, total: Math.round(total * 100) / 100 });
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Milk Rate Calculator</h1>
      <p className="mt-2 text-muted-foreground">
        Calculate milk price based on FAT & SNF values using standard dairy rates.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Calculator className="h-5 w-5 text-primary" />
              Enter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Animal Type</Label>
              <Select value={animalType} onValueChange={setAnimalType}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cow">Cow</SelectItem>
                  <SelectItem value="buffalo">Buffalo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>FAT (%)</Label>
              <Input type="number" placeholder="e.g. 4.5" value={fat} onChange={(e) => setFat(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>SNF (%)</Label>
              <Input type="number" placeholder="e.g. 8.5" value={snf} onChange={(e) => setSnf(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Quantity (Liters)</Label>
              <Input type="number" placeholder="e.g. 10" value={liters} onChange={(e) => setLiters(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={calculate} className="w-full">
              Calculate Rate
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="font-display">Calculation Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                  <p className="text-sm text-muted-foreground">Rate per Liter</p>
                  <p className="mt-1 font-display text-3xl font-bold text-primary">₹{result.rate}</p>
                </div>
                <div className="rounded-lg bg-card p-4 text-center shadow-sm">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="mt-1 font-display text-3xl font-bold text-accent">₹{result.total}</p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                <p><strong>Formula:</strong> FAT × {animalType === "buffalo" ? "8.0" : "6.5"} + SNF × 0.36 = Rate/Liter</p>
                <p className="mt-1"><strong>Details:</strong> {fat}% FAT, {snf}% SNF, {liters} Liters ({animalType})</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
