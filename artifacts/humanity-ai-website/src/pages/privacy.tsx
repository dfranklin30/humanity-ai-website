import { PageMeta } from "@/components/page-meta";
import { EditorialMasthead } from "@/components/editorial-masthead";

export default function Privacy() {
  return (
    <div>
      <PageMeta
        title="Privacy Policy"
        description="Learn how Humanity + AI, Inc. collects and uses information gathered through our website and app."
        canonical="/privacy"
      />
      <EditorialMasthead
        kicker="Legal"
        title="Privacy Policy"
        tagline="Last updated: July 2026"
      />

      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              Humanity + AI, Inc. (we, us, or our) is a 501(c)(3) nonprofit organization. This policy explains what information we collect through our website and app, and how we use it.
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Information We Collect</h2>
                <ul className="space-y-5 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Contact Form</span>
                      {" — "}
                      When you reach out to us through our Contact page, we collect your name, email address, and any message you send us. We use this solely to respond to your inquiry and never share it with third parties for advertising.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">AI Hub Assistant</span>
                      {" — "}
                      Questions you submit to our AI Hub assistant are stored to power and improve the assistant's responses. These are not linked to your personal identity.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Analytics</span>
                      {" — "}
                      We use Google Analytics to understand how visitors use our site, including device identifiers and usage patterns such as pages viewed and interactions. This data helps us improve our programs and content. It is not used for advertising or shared with data brokers.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Community Slack</span>
                      {" — "}
                      Our AI Hub links to a public Slack community. If you choose to join, Slack's own privacy policy governs your data there.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">What We Don't Do</h2>
                <ul className="space-y-3 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>We do not sell your data.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>We do not use your information for third-party advertising.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <span>We do not knowingly collect data from children under 13.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-4">Your Choices</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You may contact us at any time to ask what information we have about you or to request its deletion.
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
