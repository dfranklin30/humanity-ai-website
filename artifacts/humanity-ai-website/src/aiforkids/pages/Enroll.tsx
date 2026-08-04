import { useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck } from "lucide-react";
import Seo from "../components/Seo";
import { Button, Card, Eyebrow, Field, H2, Lede, Pill, Section, cx, inputCls } from "../components/ui";
import { CONSENTS, CONSENT_VERSION } from "../content/consents";
import { BASE, GRADE_BANDS, ORG, PROGRAM, SESSIONS, TIERS, formatPrice } from "../content/program";

type PayChoice = "pay" | "scholarship" | "hold";

type FormState = {
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  relationship: string;
  studentFirstName: string;
  studentLastInitial: string;
  studentAge: string;
  gradeBandId: string;
  schoolName: string;
  accommodations: string;
  sessionId: string;
  tierId: string;
  payChoice: PayChoice;
  consents: Record<string, boolean>;
};

const STEPS = ["Parent", "Student", "Program", "Consent", "Review"] as const;

function initialState(search: string): FormState {
  const params = new URLSearchParams(search);
  return {
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    relationship: "Parent",
    studentFirstName: "",
    studentLastInitial: "",
    studentAge: "",
    gradeBandId: "",
    schoolName: "",
    accommodations: "",
    sessionId: params.get("session") || "",
    tierId: params.get("tier") || "creator",
    payChoice: "pay",
    consents: {},
  };
}

export default function Enroll() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialState(search));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const tier = useMemo(() => TIERS.find((t) => t.id === form.tierId) ?? TIERS[0], [form.tierId]);
  const band = GRADE_BANDS.find((g) => g.id === form.gradeBandId);
  const canPayNow = tier.price !== null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key as string]: "" }));
  }

  function validate(current: number): boolean {
    const e: Record<string, string> = {};
    if (current === 0) {
      if (!form.guardianName.trim()) e.guardianName = "Please enter your name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.guardianEmail))
        e.guardianEmail = "Please enter a valid email address.";
    }
    if (current === 1) {
      if (!form.studentFirstName.trim()) e.studentFirstName = "Please enter your student's first name.";
      if (!form.gradeBandId) e.gradeBandId = "Please choose a grade band.";
    }
    if (current === 3) {
      const missing = CONSENTS.filter((c) => c.required && !form.consents[c.id]);
      if (missing.length) e.consents = "Please agree to each required item to continue.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validate(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!validate(3)) {
      setStep(3);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/aiforkids/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          consentVersion: CONSENT_VERSION,
          consents: CONSENTS.filter((c) => form.consents[c.id]).map((c) => c.id),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || "We couldn't save that. Please try again.");
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl as string;
        return;
      }
      navigate(`${BASE}/enroll/received?ref=${encodeURIComponent(body.reference || "")}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Seo
        title="Enroll | AI Builders Academy"
        description="Parent-initiated enrollment for the six-week AI Builders Academy. Takes about five minutes. Scholarships available."
        path={`${BASE}/enroll`}
        noIndex
      />

      <Section tone="gradient" className="!pb-8">
        <Eyebrow>Enrollment</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Enroll your student
        </h1>
        <Lede>
          About five minutes. Enrollment is opened by a parent or guardian — students don't register
          themselves, and we only ask for what running the program requires.
        </Lede>
      </Section>

      <Section tone="white" className="!pt-6">
        {/* Progress */}
        <ol className="mb-10 flex flex-wrap gap-2" aria-label="Enrollment progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cx(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
                  i === step
                    ? "bg-slate-900 text-white"
                    : i < step
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-500",
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <Check className="h-4 w-4" aria-hidden="true" /> : <span>{i + 1}</span>}
                {label}
              </span>
            </li>
          ))}
        </ol>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* Step 0 — parent */}
            {step === 0 ? (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900">Parent or guardian</h2>
                <p className="mt-2 text-sm text-slate-600">
                  This is who we contact about sessions, schedule changes and the showcase.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field label="Your full name" htmlFor="gname" required error={errors.guardianName}>
                    <input
                      id="gname"
                      className={inputCls}
                      autoComplete="name"
                      value={form.guardianName}
                      onChange={(e) => set("guardianName", e.target.value)}
                    />
                  </Field>
                  <Field label="Email" htmlFor="gemail" required error={errors.guardianEmail}>
                    <input
                      id="gemail"
                      type="email"
                      className={inputCls}
                      autoComplete="email"
                      value={form.guardianEmail}
                      onChange={(e) => set("guardianEmail", e.target.value)}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="gphone" hint="For same-day schedule changes only.">
                    <input
                      id="gphone"
                      type="tel"
                      className={inputCls}
                      autoComplete="tel"
                      value={form.guardianPhone}
                      onChange={(e) => set("guardianPhone", e.target.value)}
                    />
                  </Field>
                  <Field label="Relationship to student" htmlFor="grel">
                    <select
                      id="grel"
                      className={inputCls}
                      value={form.relationship}
                      onChange={(e) => set("relationship", e.target.value)}
                    >
                      {["Parent", "Legal guardian", "Grandparent (legal guardian)", "Other guardian"].map(
                        (r) => (
                          <option key={r}>{r}</option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>
              </Card>
            ) : null}

            {/* Step 1 — student */}
            {step === 1 ? (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900">About your student</h2>
                <p className="mt-2 text-sm text-slate-600">
                  We ask for a first name and a last initial — not a full name. That's enough to run a
                  class of twenty.
                </p>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Student's first name"
                    htmlFor="sfirst"
                    required
                    error={errors.studentFirstName}
                  >
                    <input
                      id="sfirst"
                      className={inputCls}
                      value={form.studentFirstName}
                      onChange={(e) => set("studentFirstName", e.target.value)}
                    />
                  </Field>
                  <Field label="Last initial" htmlFor="slast" hint="Just one letter.">
                    <input
                      id="slast"
                      maxLength={1}
                      className={inputCls}
                      value={form.studentLastInitial}
                      onChange={(e) => set("studentLastInitial", e.target.value.toUpperCase())}
                    />
                  </Field>
                  <Field label="Age" htmlFor="sage">
                    <input
                      id="sage"
                      inputMode="numeric"
                      className={inputCls}
                      value={form.studentAge}
                      onChange={(e) => set("studentAge", e.target.value.replace(/\D/g, "").slice(0, 2))}
                    />
                  </Field>
                  <Field label="School (optional)" htmlFor="sschool">
                    <input
                      id="sschool"
                      className={inputCls}
                      value={form.schoolName}
                      onChange={(e) => set("schoolName", e.target.value)}
                    />
                  </Field>
                </div>

                <div className="mt-6">
                  <Field
                    label="Grade band"
                    htmlFor="sband"
                    required
                    error={errors.gradeBandId}
                    hint="Students are grouped with their own age range."
                  >
                    <div className="grid gap-3 sm:grid-cols-3" id="sband">
                      {GRADE_BANDS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => set("gradeBandId", g.id)}
                          aria-pressed={form.gradeBandId === g.id}
                          className={cx(
                            "rounded-2xl border-2 px-4 py-4 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200",
                            form.gradeBandId === g.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300",
                          )}
                        >
                          <span className="block font-bold text-slate-900">{g.label}</span>
                          <span className="block text-xs text-slate-500">{g.ages}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="mt-6">
                  <Field
                    label="Allergies, medical needs or accommodations (optional)"
                    htmlFor="sacc"
                    hint="Shared only with the instructor and host site staff. Leave blank if there's nothing to note."
                  >
                    <textarea
                      id="sacc"
                      rows={3}
                      className={inputCls}
                      value={form.accommodations}
                      onChange={(e) => set("accommodations", e.target.value)}
                    />
                  </Field>
                </div>
              </Card>
            ) : null}

            {/* Step 2 — program */}
            {step === 2 ? (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900">Choose your program</h2>

                <h3 className="mt-7 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Session
                </h3>
                {SESSIONS.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
                    Cohort dates are being finalised. Complete your enrollment now to hold your place —
                    we'll email you the schedule as soon as it's set.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {SESSIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => set("sessionId", s.id)}
                        aria-pressed={form.sessionId === s.id}
                        className={cx(
                          "rounded-2xl border-2 px-5 py-4 text-left transition",
                          form.sessionId === s.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300",
                        )}
                      >
                        <span className="block font-bold text-slate-900">{s.label}</span>
                        <span className="block text-sm text-slate-600">
                          {s.schedule} · {s.location}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Tier
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {TIERS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set("tierId", t.id)}
                      aria-pressed={form.tierId === t.id}
                      className={cx(
                        "rounded-2xl border-2 px-5 py-5 text-left transition",
                        form.tierId === t.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {t.name} {t.emoji}
                        </span>
                        <span className="font-extrabold text-slate-900">{formatPrice(t.price)}</span>
                      </span>
                      <span className="mt-1 block text-sm text-slate-600">{t.summary}</span>
                    </button>
                  ))}
                </div>

                <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
                  How would you like to handle tuition?
                </h3>
                <div className="mt-3 grid gap-3">
                  {(
                    [
                      [
                        "pay",
                        canPayNow ? `Pay ${formatPrice(tier.price)} now` : "Pay when the price is announced",
                        canPayNow
                          ? "Secure checkout on the next screen. Card details never touch this site."
                          : "We'll email you when this tier's price is set — nothing is charged today.",
                      ],
                      [
                        "scholarship",
                        "Apply for a scholarship",
                        "Full or partial. No documentation required, and nothing is charged unless you accept a paid seat.",
                      ],
                      [
                        "hold",
                        "Hold my place and invoice me later",
                        "Useful if a school, PTA or sponsor is covering the seat.",
                      ],
                    ] as [PayChoice, string, string][]
                  ).map(([id, label, blurb]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set("payChoice", id)}
                      aria-pressed={form.payChoice === id}
                      className={cx(
                        "rounded-2xl border-2 px-5 py-4 text-left transition",
                        form.payChoice === id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <span className="block font-bold text-slate-900">{label}</span>
                      <span className="block text-sm text-slate-600">{blurb}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* Step 3 — consent */}
            {step === 3 ? (
              <Card>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">Consent</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Each item is agreed separately — we don't bundle them behind one checkbox. Read what
                  you're agreeing to; the two optional items change nothing about your student's place
                  in the program.
                </p>

                <ul className="mt-7 space-y-4">
                  {CONSENTS.map((c) => (
                    <li
                      key={c.id}
                      className={cx(
                        "rounded-2xl border-2 p-5 transition",
                        form.consents[c.id] ? "border-teal-400 bg-teal-50/50" : "border-slate-200 bg-white",
                      )}
                    >
                      <label className="flex cursor-pointer gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 shrink-0 rounded border-slate-400 text-blue-600 focus:ring-blue-500"
                          checked={Boolean(form.consents[c.id])}
                          onChange={(e) => {
                            setForm((f) => ({
                              ...f,
                              consents: { ...f.consents, [c.id]: e.target.checked },
                            }));
                            setErrors((er) => ({ ...er, consents: "" }));
                          }}
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {c.label}
                            {c.required ? (
                              <span className="ml-2 align-middle">
                                <Pill tone="orange">Required</Pill>
                              </span>
                            ) : (
                              <span className="ml-2 align-middle">
                                <Pill tone="slate">Optional</Pill>
                              </span>
                            )}
                          </span>
                          <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                            {c.detail}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>

                {errors.consents ? (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                    {errors.consents}
                  </p>
                ) : null}

                <p className="mt-6 text-xs text-slate-500">
                  Consent version {CONSENT_VERSION}. We store which items you agreed to and when. You can
                  withdraw an optional consent at any time by emailing {ORG.email}.
                </p>
              </Card>
            ) : null}

            {/* Step 4 — review */}
            {step === 4 ? (
              <Card>
                <h2 className="text-2xl font-bold text-slate-900">Review and submit</h2>
                <dl className="mt-7 divide-y divide-slate-200">
                  {[
                    ["Parent or guardian", `${form.guardianName} (${form.relationship})`],
                    ["Email", form.guardianEmail],
                    ["Phone", form.guardianPhone || "—"],
                    [
                      "Student",
                      `${form.studentFirstName}${form.studentLastInitial ? ` ${form.studentLastInitial}.` : ""}${
                        form.studentAge ? `, age ${form.studentAge}` : ""
                      }`,
                    ],
                    ["Grade band", band ? `${band.label} (${band.ages})` : "—"],
                    ["School", form.schoolName || "—"],
                    ["Accommodations", form.accommodations || "None noted"],
                    ["Tier", `${tier.name} — ${formatPrice(tier.price)}`],
                    [
                      "Tuition",
                      form.payChoice === "pay"
                        ? canPayNow
                          ? `Paying ${formatPrice(tier.price)} at checkout`
                          : "Price to be announced — nothing charged today"
                        : form.payChoice === "scholarship"
                          ? "Applying for a scholarship"
                          : "Hold my place, invoice later",
                    ],
                    [
                      "Consents agreed",
                      CONSENTS.filter((c) => form.consents[c.id])
                        .map((c) => c.id)
                        .join(", ") || "none",
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-wrap gap-2 py-3">
                      <dt className="w-48 shrink-0 text-sm font-semibold text-slate-500">{k}</dt>
                      <dd className="flex-1 text-sm text-slate-800">{v}</dd>
                    </div>
                  ))}
                </dl>

                {serverError ? (
                  <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                    {serverError}
                  </p>
                ) : null}

                <div className="mt-8">
                  <Button size="lg" onClick={submit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Submitting…
                      </>
                    ) : form.payChoice === "pay" && canPayNow ? (
                      <>
                        <Lock className="h-4 w-4" aria-hidden="true" /> Continue to secure checkout
                      </>
                    ) : (
                      <>
                        Submit enrollment <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ) : null}

            {/* Nav */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={back} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} size="lg">
                  Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>

          {/* Summary rail */}
          <aside className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Your enrollment
              </h2>
              <p className="mt-4 text-xl font-bold text-slate-900">{PROGRAM.name}</p>
              <p className="text-sm text-slate-600">
                {PROGRAM.weeks} weeks · {PROGRAM.minutesPerSession} minutes weekly · max{" "}
                {PROGRAM.maxStudents} students
              </p>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Student</dt>
                  <dd className="font-medium text-slate-800">{form.studentFirstName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Grade band</dt>
                  <dd className="font-medium text-slate-800">{band?.label || "—"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Tier</dt>
                  <dd className="font-medium text-slate-800">{tier.name}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
                  <dt className="font-semibold text-slate-700">Tuition</dt>
                  <dd className="text-lg font-extrabold text-slate-900">{formatPrice(tier.price)}</dd>
                </div>
              </dl>
              <p className="mt-5 flex gap-2 text-xs leading-relaxed text-slate-500">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Payment is handled by Stripe on their own secure page. Card details never touch this
                website.
              </p>
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Need help? {ORG.email} · {ORG.phone}
              </p>
            </Card>
          </aside>
        </div>
      </Section>
    </>
  );
}
