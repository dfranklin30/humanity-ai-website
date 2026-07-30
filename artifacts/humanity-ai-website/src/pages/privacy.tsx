import { PageMeta } from "@/components/page-meta";
import { EditorialMasthead } from "@/components/editorial-masthead";

export default function Privacy() {
  return (
    <div>
      <PageMeta
        title="Privacy Policy"
        description="How Humanity + AI, Inc. collects and uses information gathered through our website and our iOS and Android apps."
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
              Humanity + AI, Inc. (we, us, or our) is a 501(c)(3) nonprofit organization. This policy explains what
              information we collect, how we use it, and the choices you have.
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">What This Policy Covers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  This policy applies to everything we operate under the Humanity + AI name: the website at
                  humanityplusai.org, and the Humanity + AI mobile app for Android and iOS. The mobile apps present
                  the same website content in an app window, so the practices described here are identical across
                  all three. Wherever this policy says the app, it means both the Android and the iOS app.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Information We Collect</h2>
                <ul className="space-y-5 list-none p-0">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Contact Form</span>
                      {" — "}
                      When you reach out to us through our Contact page, we collect your name, email address, and any
                      message you send us. We use this solely to respond to your inquiry and never share it with third
                      parties for advertising.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Member Accounts</span>
                      {" — "}
                      If you create an account to write, publish, or contribute to our library, we store your username
                      or email address and a securely hashed password. We never store your password in readable form.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">What You Publish</span>
                      {" — "}
                      Articles, comments, profile details, and any images or avatars you upload are stored so we can
                      display them. Anything you publish is intended to be public.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">AI Hub Assistant</span>
                      {" — "}
                      Questions you submit to our AI Hub assistant are stored to power and improve the assistant's
                      responses. These are not linked to your personal identity.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Newsletter</span>
                      {" — "}
                      If you subscribe, we keep your email address to send you our updates. Every email includes an
                      unsubscribe link, and you can also ask us to remove you at any time.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Donations and Memberships</span>
                      {" — "}
                      Payments are processed by Stripe. Your card number is entered on Stripe's systems and never
                      reaches ours. We receive only a record of the transaction: your name, email address, the amount,
                      and the date, which we keep for receipts and nonprofit accounting.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Analytics</span>
                      {" — "}
                      We use Google Analytics to understand how visitors use our site and app, including device
                      identifiers and usage patterns such as pages viewed and interactions. This data helps us improve
                      our programs and content. It is not used for advertising or shared with data brokers.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      <span className="font-semibold">Community Slack</span>
                      {" — "}
                      Our AI Hub links to a public Slack community. If you choose to join, Slack's own privacy policy
                      governs your data there.
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">What the Mobile Apps Do Not Collect</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Android and iOS apps do not request access to your location, contacts, calendar, microphone, or
                  health data. They do not read your photo library except when you deliberately choose an image to
                  upload. They contain no advertising SDKs, do not use your device's advertising identifier, and do not
                  track you across other apps or websites.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">How We Use Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the information above to operate and secure the site and app, to answer your messages, to
                  provide account and publishing features, to process donations and memberships, to send the newsletter
                  if you asked for it, and to understand aggregate usage so we can improve what we build. That is the
                  complete list of purposes.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">How We Share Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell or rent your information, and we do not share it with third parties for advertising or
                  marketing. We share it only with the service providers that make the site and app work on our behalf:
                  Google Cloud for hosting, Stripe for payments, Google Analytics for aggregate usage measurement, and
                  our email delivery provider. We may also disclose information if the law requires it.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Security and Retention</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All data travels between your device and our servers over encrypted connections (HTTPS/TLS). We keep
                  information only as long as we need it for the purposes above, and we delete it on request. Deleted
                  records are removed from our backups within 90 days.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Our Commitments</h2>
                <ul className="space-y-5 list-none p-0">
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
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Your Choices</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You may contact us at any time to ask what information we have about you, to correct it, or to
                  request its deletion. To delete your account and the data associated with it, follow the steps on our{" "}
                  <a href="/delete-account" className="underline">
                    account and data deletion page
                  </a>
                  . You can request deletion of your data without deleting your account, and you can unsubscribe from
                  the newsletter without affecting your account.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Changes to This Policy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If we update this policy, we will revise the date shown above. Material changes will be announced on
                  the site.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Contact Us</h2>
                <p>
                  Email:{" "}
                  <a href="mailto:danielle@humanityplusai.org" className="underline">
                    danielle@humanityplusai.org
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a href="tel:8086522090" className="underline">
                    (808) 652-2090
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
