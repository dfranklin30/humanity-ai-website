import { PageMeta } from "@/components/page-meta";
import { EditorialMasthead } from "@/components/editorial-masthead";

export default function Terms() {
  return (
    <div>
      <PageMeta
        title="Terms of Service"
        description="The terms and conditions that govern your use of the Humanity + AI, Inc. website, programs, and community."
        canonical="/terms"
      />
      <EditorialMasthead
        kicker="Legal"
        title="Terms of Service"
        tagline="Last updated: July 2026"
      />

      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              Welcome to Humanity + AI, Inc. (we, us, or our), a 501(c)(3) nonprofit organization. By accessing or using our website, mobile app, programs, or community, you agree to these Terms of Service. If you do not agree, please do not use our services.
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Use of Our Services</h2>
                <ul className="space-y-5 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Educational Purpose</span>
                      {" — "}
                      Our website, Learning Hub, events, and AI Hub assistant are provided for educational and informational purposes. Content is not professional, legal, or financial advice.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Lawful Use</span>
                      {" — "}
                      You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others or restrict anyone else's use and enjoyment of them.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Accounts</span>
                      {" — "}
                      If you create an account, you are responsible for keeping your login credentials secure and for all activity that occurs under your account. Please notify us promptly of any unauthorized use.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Donations and Memberships</h2>
                <ul className="space-y-5 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Charitable Contributions</span>
                      {" — "}
                      Donations and membership contributions support our nonprofit mission and are tax-deductible to the extent permitted by law. We will provide a receipt for your records.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Refunds</span>
                      {" — "}
                      Donations are generally non-refundable. If you believe a contribution was made in error, contact us and we will review your request in good faith.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Payment Processing</span>
                      {" — "}
                      Payments are handled by third-party processors. Your use of those services is governed by their own terms and privacy policies.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Community Conduct</h2>
                <ul className="space-y-3 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>Be respectful. Harassment, hate speech, and personal attacks are not tolerated in our events, blog comments, or community spaces.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>Do not post content that is unlawful, misleading, or infringes someone else's intellectual property.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>Our Slack community is governed by Slack's own terms in addition to these guidelines. We may remove content or restrict access for conduct that violates these standards.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The content on this site — including text, graphics, logos, and course materials — belongs to Humanity + AI, Inc. or its contributors and is protected by copyright. You may share our content for personal, non-commercial purposes with attribution. Blog authors retain ownership of their posts and grant us a license to publish them on our platforms.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Third-Party Links and Tools</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our site links to third-party resources such as AI tools, Slack, and external learning materials. We do not control and are not responsible for the content, terms, or privacy practices of those services.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Disclaimers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Our services are provided "as is" without warranties of any kind. While we strive for accuracy, we do not guarantee that content — including responses from our AI Hub assistant — is complete, current, or error-free. AI-generated responses may contain mistakes; please use your own judgment before relying on them.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the fullest extent permitted by law, Humanity + AI, Inc. and its directors, officers, volunteers, and partners will not be liable for any indirect, incidental, or consequential damages arising from your use of our services.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Changes to These Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these Terms from time to time. When we do, we will revise the "Last updated" date above. Continued use of our services after changes take effect constitutes acceptance of the revised Terms.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Contact Us</h2>
                <div className="text-muted-foreground leading-relaxed space-y-1">
                  <p className="font-semibold text-foreground">Humanity + AI, Inc.</p>
                  <p>
                    Email:{" "}
                    <a
                      href="mailto:danielle@humanityplusai.org"
                      className="text-primary hover:underline"
                    >
                      danielle@humanityplusai.org
                    </a>
                  </p>
                  <p>
                    Phone:{" "}
                    <a
                      href="tel:8086522090"
                      className="text-primary hover:underline"
                    >
                      (808) 652-2090
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
