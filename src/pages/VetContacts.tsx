import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Star, Clock } from "lucide-react";

const vets = [
  { name: "Dr. Rajesh Kumar", specialization: "Large Animal Surgery", location: "Pune, Maharashtra", phone: "+91 98765 43210", rating: 4.8, available: "9 AM – 6 PM", experience: "15 years" },
  { name: "Dr. Priya Sharma", specialization: "Bovine Medicine", location: "Jaipur, Rajasthan", phone: "+91 99887 65432", rating: 4.9, available: "8 AM – 8 PM", experience: "12 years" },
  { name: "Dr. Suresh Yadav", specialization: "Animal Nutrition", location: "Karnal, Haryana", phone: "+91 97654 32100", rating: 4.6, available: "10 AM – 5 PM", experience: "20 years" },
  { name: "Dr. Anita Desai", specialization: "Reproductive Health", location: "Anand, Gujarat", phone: "+91 94567 89012", rating: 4.7, available: "9 AM – 7 PM", experience: "10 years" },
  { name: "Dr. Manpreet Singh", specialization: "Emergency Vet Care", location: "Ludhiana, Punjab", phone: "+91 93456 78901", rating: 4.5, available: "24/7", experience: "8 years" },
  { name: "Dr. Lakshmi Nair", specialization: "Dairy Cattle Health", location: "Thrissur, Kerala", phone: "+91 96543 21098", rating: 4.8, available: "8 AM – 6 PM", experience: "18 years" },
];

export default function VetContacts() {
  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">Veterinary Doctors</h1>
      <p className="mt-2 text-muted-foreground">Connect with experienced veterinary doctors for your cattle health needs.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vets.map((v) => (
          <Card key={v.name} className="transition-shadow hover:shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
                  {v.name.split(" ").slice(1).map(n => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-base font-bold">{v.name}</h3>
                  <p className="text-sm text-muted-foreground">{v.specialization}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="font-medium">{v.rating}</span>
                    <span className="text-muted-foreground">· {v.experience}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {v.location}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {v.available}
                </div>
              </div>
              <Button size="sm" className="mt-4 w-full gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Call Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
