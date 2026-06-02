export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="font-heading font-black text-4xl mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Effective date: January 1, 2026 · NextCut — a StealthO company</p>

        <div className="prose prose-sm prose-invert max-w-none space-y-8 text-muted-foreground">

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using NextCut ("the Service"), you agree to these Terms of Service. If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these terms. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">2. Description of Service</h2>
            <p>NextCut provides a booking platform for independent barbers and barbershops ("Barbers") to list their services and accept appointments from clients. NextCut is not a staffing agency, employer, or party to the services performed by Barbers.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">3. Acceptable Use</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law</li>
              <li>Post false, misleading, or deceptive content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to spam or send unsolicited communications</li>
              <li>Scrape, copy, or resell any part of the Service without written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">4. Barber Accounts & Client Relationships</h2>
            <p>Barbers own their client relationships. NextCut provides infrastructure (booking pages, payment processing, reminders) but does not own or control the barber-client relationship. Barbers are responsible for setting their own no-show policies, service prices, and cancellation terms. Clients who book through a barber's personal referral link are the barber's direct clients.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">5. Payments & Commission</h2>
            <p className="mb-2">NextCut processes payments via Stripe. Commission rates are as follows:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">0%</strong> — clients booked through the barber's own referral link</li>
              <li><strong className="text-foreground">3%</strong> — barber-direct clients who found the barber on NextCut</li>
              <li><strong className="text-foreground">4%</strong> — repeat clients previously sourced by NextCut</li>
              <li><strong className="text-foreground">7%</strong> — new clients sourced by NextCut via marketplace, search, or campaigns</li>
            </ul>
            <p className="mt-2">Tips are always 100% the barber's and are never included in commission calculations. Commission rates may change with 30 days' notice.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">6. Paid Plans & Billing</h2>
            <p>Paid plans (Growth, Pro, Spotlight) are billed monthly. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period. No partial-month refunds are provided. Prices may change with 30 days' notice to active subscribers.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">7. No-Show Charges</h2>
            <p>Barbers may configure a no-show charge policy. By booking with a card on file, clients authorize NextCut (on behalf of the Barber) to charge the saved card in accordance with the Barber's stated policy if the client fails to appear or cancels outside the cancellation window. Clients will be informed of the policy at the time of booking.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">8. Service "As Is"</h2>
            <p>The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. NextCut does not warrant that the Service will be uninterrupted, error-free, or completely secure.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, NextCut and its parent company StealthO shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of revenue, data, or profits, arising out of or related to your use of the Service. Our total liability shall not exceed the amount paid by you to NextCut in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">10. Termination</h2>
            <p>We may suspend or terminate your account for violation of these terms, illegal activity, or at our discretion with reasonable notice. You may delete your account at any time. Upon termination, your booking history will be available for export for 30 days.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">11. Changes to Terms</h2>
            <p>We may update these terms at any time. We'll notify you via email or in-app notice. Continued use after changes take effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-xl text-foreground mb-3">12. Contact</h2>
            <p>Questions? Contact us at <a href="mailto:support@nextcut.app" className="text-primary hover:underline">support@nextcut.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}