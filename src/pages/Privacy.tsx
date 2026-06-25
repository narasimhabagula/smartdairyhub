import { Card, CardContent } from "@/components/ui/card";

const SECTIONS: { h: string; p: string }[] = [
  { h: "Information We Collect", p: "Account details (name, email, phone, role), business information for Industry accounts, listings and product data you upload, support tickets, and technical data such as device type and IP address." },
  { h: "How We Use Data", p: "To operate Smart Dairy Hub — authenticate you, show relevant listings and rates, process orders, respond to support, prevent fraud, and improve our services." },
  { h: "Cookies", p: "We use essential cookies for sign-in sessions and preferences (e.g. language). We do not use third-party advertising cookies." },
  { h: "Location Permissions", p: "We request your location only to find nearby veterinarians, dairies and listings. You can deny or revoke this permission at any time from your browser settings." },
  { h: "Camera & Photo Permissions", p: "Photo uploads use your device's file picker or camera. Photos are stored securely and shown only on your listings or profile." },
  { h: "Data Security", p: "Data is hosted on secure infrastructure with encryption in transit (HTTPS). Database access is protected by row-level security so users only see their own private data." },
  { h: "Third-Party Services", p: "We use Google Maps for vet location features and trusted payment partners when applicable. These providers have their own privacy policies." },
  { h: "User Rights", p: "You may access, correct or download your personal data. Contact privacy@smartdairyhub.in for requests." },
  { h: "Account Deletion", p: "You can request account deletion at any time by emailing privacy@smartdairyhub.in. We remove your personal data subject to legal retention requirements." },
  { h: "Contact Details", p: "For privacy questions, email privacy@smartdairyhub.in or write to Smart Dairy Hub, Hyderabad, Telangana, India." },
];

export default function Privacy() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      <Card className="mt-6">
        <CardContent className="prose prose-sm max-w-none p-6 dark:prose-invert">
          <p>Your privacy matters. This policy explains what data we collect, how we use it, and the choices you have.</p>
          {SECTIONS.map((s) => (
            <div key={s.h} className="mt-6">
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <p className="mt-1 text-muted-foreground">{s.p}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
