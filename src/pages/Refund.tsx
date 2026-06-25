import { Card, CardContent } from "@/components/ui/card";

export default function Refund() {
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
      <Card className="mt-6"><CardContent className="prose prose-sm max-w-none p-6 dark:prose-invert">
        <p>Smart Dairy Hub connects buyers and sellers. Most cattle, livestock and feed transactions take place directly between users — refunds for these are governed by the agreement between buyer and seller.</p>
        <h2>Platform fees & premium services</h2>
        <p>If you've paid for a premium platform service and are not satisfied, you can request a refund within <strong>7 days</strong> of payment by emailing <a href="mailto:billing@smartdairyhub.in">billing@smartdairyhub.in</a> with your transaction ID. Eligible refunds are processed within 7–10 business days to the original payment method.</p>
        <h2>Non-refundable items</h2>
        <ul>
          <li>Verification fees once verification has been completed</li>
          <li>Promotion / boost charges already delivered</li>
          <li>Off-platform cash payments between farmers and buyers</li>
        </ul>
        <h2>Dispute resolution</h2>
        <p>For marketplace disputes, raise a ticket from Customer Support → Report Fraud, and our team will mediate where possible.</p>
        <h2>Contact</h2>
        <p>billing@smartdairyhub.in · 1800-180-1551</p>
      </CardContent></Card>
    </div>
  );
}
