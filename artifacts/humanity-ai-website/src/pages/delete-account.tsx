import { PageMeta } from "@/components/page-meta";
import { EditorialMasthead } from "@/components/editorial-masthead";

const ROWS: { data: string; outcome: string }[] = [
  {
    data: "Account record (username, email address, hashed password)",
    outcome: "Permanently deleted",
  },
  {
    data: "Contact form messages (name, email address, message)",
    outcome: "Permanently deleted",
  },
  {
    data: "AI Hub questions you submitted",
    outcome:
      "Permanently deleted where they can be identified; questions are otherwise stored without any link to your identity",
  },
  {
    data: "Articles, comments, or contributions you published",
    outcome:
      "Deleted, or at your request kept online and de-attributed — you choose in your request",
  },
  {
    data: "Images and avatars you uploaded",
    outcome: "Permanently deleted",
  },
  {
    data: "Newsletter subscription",
    outcome: "Email address removed from our mailing list",
  },
  {
    data: "Google Analytics usage data",
    outcome:
      "Aggregated and not linked to your identity; retained per Google Analytics' standard retention and never used for advertising",
  },
  {
    data: "Donation and membership receipts",
    outcome:
      "Retained only as long as tax and nonprofit accounting law requires, then deleted",
  },
];

export default function DeleteAccount() {
  return (
    <div>
      <PageMeta
        title="Delete Your Account and Data"
        description="How to request deletion of your Humanity + AI account and the data associated with it."
        canonical="/delete-account"
      />
      <EditorialMasthead
        kicker="Legal"
        title="Delete Your Account and Data"
        tagline="Last updated: July 2026"
      />

      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              This page explains how to request deletion of your Humanity + AI account — used on
              humanityplusai.org and in the Humanity + AI mobile app for Android and iOS, both published by
              Humanity + AI, Inc. — and the data associated with it. You can also request deletion of your data
              without deleting your account.
            </p>

            <div className="space-y-12">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">How to Request Deletion</h2>
                <ol className="space-y-5 list-none p-0 counter-reset">
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      Email{" "}
                      <a
                        href="mailto:danielle@humanityplusai.org?subject=Delete%20my%20account%20and%20data"
                        className="underline"
                      >
                        danielle@humanityplusai.org
                      </a>{" "}
                      from the address on your account, or call{" "}
                      <a href="tel:8086522090" className="underline">
                        (808) 652-2090
                      </a>
                      .
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      Put <span className="font-semibold">&ldquo;Delete my account and data&rdquo;</span> in the
                      subject line. If you want your data removed but wish to keep your account, write{" "}
                      <span className="font-semibold">&ldquo;Delete my data&rdquo;</span> instead.
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>Include the username or email address on the account so we can locate it.</div>
                  </li>
                  <li className="flex gap-4">
                    <span className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2.5" />
                    <div>
                      We confirm the request by replying to that email address, complete the deletion within{" "}
                      <span className="font-semibold">30 days</span>, and email you when it is done.
                    </div>
                  </li>
                </ol>
                <p className="text-muted-foreground leading-relaxed mt-6">
                  No account is required to make a request. If you only used the contact form or the AI Hub, the
                  same email address works.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">What Is Deleted, and What Is Kept</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left font-semibold text-muted-foreground border-b border-border py-3 pr-6 align-top">
                          Data
                        </th>
                        <th className="text-left font-semibold text-muted-foreground border-b border-border py-3 align-top">
                          What happens
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map(row => (
                        <tr key={row.data}>
                          <td className="border-b border-border py-3 pr-6 align-top">{row.data}</td>
                          <td className="border-b border-border py-3 align-top text-muted-foreground">
                            {row.outcome}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-muted-foreground leading-relaxed mt-6">
                  Backups are rotated regularly, and deleted records are removed from our backups within{" "}
                  <span className="font-semibold">90 days</span>.
                </p>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight mb-6">Questions</h2>
                <p>
                  Humanity + AI, Inc.
                </p>
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
                <p>
                  See also our{" "}
                  <a href="/privacy" className="underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
