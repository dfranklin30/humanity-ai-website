import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Section } from "../components/ui";
import { BASE, CURRICULUM, ORG } from "../content/program";

export default function EnrollReceived() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");
  const ref = params.get("ref");

  const [state, setState] = useState<"idle" | "verifying" | "paid" | "failed">(
    sessionId ? "verifying" : "idle",
  );
  const [reference, setReference] = useState<string | null>(ref);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/aiforkids/verify?session_id=${encodeURIComponent(sessionId)}`,
        );
        const body = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && body?.paid) {
          setReference(body.reference ?? null);
          setState("paid");
        } else {
          setState("failed");
        }
      } catch {
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <>
      <Seo
        title="Enrollment received | AI Builders Academy"
        description="Your AI Builders Academy enrollment has been received."
        path={`${BASE}/enroll/received`}
        noIndex
      />

      <Section tone="gradient">
        <Card className="mx-auto max-w-2xl text-center">
          {state === "verifying" ? (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" aria-hidden="true" />
              <h1 className="mt-6 text-2xl font-bold text-slate-900">Confirming your payment…</h1>
              <p className="mt-2 text-slate-600">This takes a moment. Please don't close the page.</p>
            </>
          ) : state === "failed" ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                We couldn't confirm that payment automatically
              </h1>
              <p className="mt-3 text-slate-600">
                Your enrollment details were saved. If you completed checkout, don't pay again — email{" "}
                <a className="font-semibold text-blue-700 underline" href={`mailto:${ORG.email}`}>
                  {ORG.email}
                </a>{" "}
                and we'll confirm it by hand today.
              </p>
            </>
          ) : (
            <>
              <CheckCircle2 className="mx-auto h-14 w-14 text-teal-600" aria-hidden="true" />
              <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
                {state === "paid" ? "You're enrolled." : "Enrollment received."}
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                {state === "paid"
                  ? "Payment confirmed. A receipt is on its way to your inbox."
                  : "We've got your student's details and your consents on file."}
              </p>
            </>
          )}

          {state === "paid" || state === "idle" ? (
            <>
              {reference ? (
                <p className="mt-6 inline-block rounded-xl bg-slate-100 px-4 py-2 font-mono text-sm text-slate-700">
                  Reference {reference}
                </p>
              ) : null}

              <div className="mt-8 text-left">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  What happens next
                </h2>
                <ol className="mt-4 space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>
                      A confirmation email is on its way. If it hasn't arrived in an hour, check spam,
                      then email us.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>
                      We'll send your cohort's dates, location and the exact AI tool list before Week 1.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                    <span>
                      Week {CURRICULUM.length} is the family showcase — put it on your calendar as soon
                      as we send dates.
                    </span>
                  </li>
                </ol>
              </div>
            </>
          ) : null}

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button href={`${BASE}/curriculum`} variant="secondary">
              See what they'll build
            </Button>
            <Button href={`${BASE}/brochure/parents`} variant="secondary">
              Parent guide
            </Button>
            <Button href={BASE} variant="ghost">
              Back to the academy
            </Button>
          </div>

          <p className="mt-8 text-sm text-slate-500">
            Questions? {ORG.email} · {ORG.phone}
          </p>
        </Card>
      </Section>
    </>
  );
}
