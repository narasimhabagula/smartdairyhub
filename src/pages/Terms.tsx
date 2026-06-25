import { Card, CardContent } from "@/components/ui/card";

const SECTIONS: { h: string; p: string }[] = [
  { h: "1. User Responsibilities", p: "You agree to provide accurate information, keep your login credentials secure, and use Smart Dairy Hub only for lawful dairy-related purposes. You are responsible for all activity under your account." },
  { h: "2. Buyer & Seller Rules", p: "Sellers must list real, accurately described products and livestock. Buyers must communicate respectfully, complete agreed transactions, and report disputes promptly. Smart Dairy Hub facilitates connections but is not a party to off-platform deals." },
  { h: "3. Industry Rules", p: "Industry accounts publishing milk rates must be verified by our admin team. Rates must be accurate, updated regularly, and reflect actual procurement prices. Misleading or manipulated rates can lead to account suspension." },
  { h: "4. Marketplace Rules", p: "Only cattle feed products are permitted in the Marketplace. Listings require admin approval. Prohibited: counterfeit, expired, or unsafe items. Photos must be authentic." },
  { h: "5. Cattle Market Rules", p: "Listings must describe Cow, Buffalo, Hen or Cock animals with truthful health, breed, age and yield information. Animals must be legally owned by the seller. Cruelty, illegal trade or misrepresentation are forbidden." },
  { h: "6. Milk Rates Policy", p: "Published rates are informational and subject to change. Smart Dairy Hub does not guarantee that any company will honour a listed rate at the time of procurement." },
  { h: "7. Privacy & Data Usage", p: "We collect and process your data as described in our Privacy Policy. By using the platform you consent to this processing." },
  { h: "8. Prohibited Activities", p: "Spam, scraping, reverse engineering, fraudulent payments, impersonation, harassment, hate speech, and any activity violating Indian law are strictly prohibited." },
  { h: "9. Fraud Prevention", p: "We may verify accounts, request documents, hold suspicious transactions, and share information with authorities when fraud is suspected." },
  { h: "10. Account Suspension Policy", p: "We may suspend or terminate accounts that violate these Terms, with or without notice. Repeated or severe violations result in permanent bans." },
  { h: "11. Limitation of Liability", p: "Smart Dairy Hub is provided on an \"as-is\" basis. To the maximum extent permitted by law, we are not liable for indirect, incidental or consequential damages arising from use of the platform or off-platform transactions." },
  { h: "12. Disclaimer", p: "Veterinary, scheme and pricing information is provided for convenience and is not a substitute for professional advice. Verify critical decisions independently." },
  { h: "13. Governing Law", p: "These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana." },
  { h: "14. Contact Information", p: "Questions about these Terms? Email legal@smartdairyhub.in or visit our Contact Us page." },
];

export default function Terms() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      <Card className="mt-6">
        <CardContent className="prose prose-sm max-w-none p-6 dark:prose-invert">
          <p>Welcome to Smart Dairy Hub. By creating an account or using our services, you agree to the following Terms &amp; Conditions. Please read them carefully.</p>
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
