export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="font-heading font-black text-4xl mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Effective date: January 1, 2026 · NextCut — a StealthO company</p>

        <div className="space-y-8 text-muted-foreground text-sm leading-relaxed">

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">1. What We Collect</h2>
            <p className="mb-2">We collect the following information when you use NextCut:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Account info:</strong> name, email address, and role (barber or client)</li>
              <li><strong className="text-foreground">Profile info (barbers):</strong> bio, location, portfolio images, specialties, license verification</li>
              <li><strong className="text-foreground">Booking data:</strong> appointment details, service, date/time, and notes</li>
              <li><strong className="text-foreground">Payment info:</strong> transaction records — card numbers are handled exclusively by Stripe and never stored on NextCut servers</li>
              <li><strong className="text-foreground">Usage data:</strong> pages visited, features used, device type, browser — for improving the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the Service (booking, payments, reminders)</li>
              <li>To communicate with you about your account and bookings</li>
              <li>To enforce no-show policies on behalf of Barbers</li>
              <li>To improve the platform and develop new features</li>
              <li>To detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">3. Payments & Stripe</h2>
            <p>NextCut uses <strong className="text-foreground">Stripe</strong> for payment processing. When you pay for a booking or when a Barber sets up payouts, your payment information is handled directly by Stripe under their privacy policy. <strong className="text-foreground">NextCut never stores card numbers, CVVs, or full payment details on our servers.</strong> We receive only a token and last-four-digits for display purposes.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">4. Sharing Your Data</h2>
            <p className="mb-2">We share your data only in limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Stripe:</strong> for payment processing and barber payouts</li>
              <li><strong className="text-foreground">Between barber and client:</strong> booking details are shared with both parties to facilitate the appointment</li>
              <li><strong className="text-foreground">Legal requirements:</strong> if required by law or valid legal process</li>
            </ul>
            <p className="mt-2">We do not sell your data to third parties. We do not share client data with competing barbers.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">5. Data Retention</h2>
            <p>We retain your account data while your account is active. Booking records are retained for up to 3 years for tax and dispute purposes. You may request deletion of your account and associated personal data at any time (see Section 6).</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Access</strong> the personal data we hold about you</li>
              <li><strong className="text-foreground">Correct</strong> inaccurate information</li>
              <li><strong className="text-foreground">Delete</strong> your account and personal data (subject to legal retention requirements)</li>
              <li><strong className="text-foreground">Export</strong> your booking history</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:support@nextcut.app" className="text-primary hover:underline">support@nextcut.app</a>.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">7. Security</h2>
            <p>We use industry-standard security measures including encryption in transit (TLS) and at rest. However, no system is completely secure. We encourage you to use a strong, unique password and to contact us immediately if you suspect unauthorized access.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">8. Cookies</h2>
            <p>We use essential cookies for authentication and session management. We may use analytics cookies (privacy-preserving) to understand how the Service is used. You can disable cookies in your browser settings, but some features may not function correctly.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">9. Changes to This Policy</h2>
            <p>We may update this policy. We'll notify you via email or in-app notice for material changes. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">10. Contact</h2>
            <p>Questions or requests: <a href="mailto:support@nextcut.app" className="text-primary hover:underline">support@nextcut.app</a><br />NextCut — a StealthO company</p>
          </section>
        </div>
      </div>
    </div>
  );
}