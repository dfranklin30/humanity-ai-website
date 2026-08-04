import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button, Field, inputCls } from "./ui";

export type InquiryKind =
  | "general"
  | "school_partnership"
  | "school_meeting"
  | "instructor"
  | "volunteer"
  | "sponsor"
  | "scholarship";

type ExtraField = {
  name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  type?: "text" | "tel" | "select";
  options?: string[];
};

const KIND_FIELDS: Record<InquiryKind, ExtraField[]> = {
  general: [],
  school_partnership: [
    { name: "organization", label: "School or district", required: true },
    { name: "role", label: "Your role", placeholder: "Principal, enrichment coordinator, PTA chair…" },
  ],
  school_meeting: [
    { name: "organization", label: "School or district", required: true },
    { name: "role", label: "Your role", placeholder: "Principal, enrichment coordinator, PTA chair…" },
    { name: "phone", label: "Phone", type: "tel" },
    {
      name: "availability",
      label: "When works for you?",
      placeholder: "e.g. Tuesday or Thursday mornings, or after 3pm any weekday",
      hint: "We'll follow up with a confirmed time — no calendar account needed.",
    },
    {
      name: "model",
      label: "Partnership model you're interested in",
      type: "select",
      options: [
        "Not sure yet — help me choose",
        "We run it, you host it",
        "Sponsored cohort",
        "After-school enrichment partner",
        "Educator training",
      ],
    },
  ],
  instructor: [{ name: "role", label: "Relevant background", placeholder: "Teaching, AI, software, robotics…" }],
  volunteer: [{ name: "organization", label: "Organization (optional)" }],
  sponsor: [{ name: "organization", label: "Company or foundation", required: true }],
  scholarship: [{ name: "organization", label: "School your student attends" }],
};

export default function InquiryForm({
  kind,
  heading,
  submitLabel = "Send",
  messageLabel = "How can we help?",
  messagePlaceholder,
  compact,
}: {
  kind: InquiryKind;
  heading?: string;
  submitLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  compact?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const extras = KIND_FIELDS[kind];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/aiforkids/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, kind }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "We couldn't send that. Please try again.");
      }
      setStatus("done");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-3xl border border-teal-200 bg-teal-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600" aria-hidden="true" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Thank you — we've got it.</h3>
        <p className="mt-2 text-slate-700">
          Someone from Humanity + AI will reply within two business days.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={compact ? "" : "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"}
      noValidate
    >
      {heading ? <h3 className="mb-6 text-xl font-bold text-slate-900">{heading}</h3> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor={`${kind}-name`} required>
          <input id={`${kind}-name`} name="name" required className={inputCls} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor={`${kind}-email`} required>
          <input
            id={`${kind}-email`}
            name="email"
            type="email"
            required
            className={inputCls}
            autoComplete="email"
          />
        </Field>

        {extras.map((f) => (
          <Field
            key={f.name}
            label={f.label}
            hint={f.hint}
            htmlFor={`${kind}-${f.name}`}
            required={f.required}
          >
            {f.type === "select" ? (
              <select id={`${kind}-${f.name}`} name={f.name} className={inputCls} defaultValue={f.options?.[0]}>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                id={`${kind}-${f.name}`}
                name={f.name}
                type={f.type === "tel" ? "tel" : "text"}
                required={f.required}
                placeholder={f.placeholder}
                className={inputCls}
              />
            )}
          </Field>
        ))}

        <div className="sm:col-span-2">
          <Field label={messageLabel} htmlFor={`${kind}-message`}>
            <textarea
              id={`${kind}-message`}
              name="message"
              rows={5}
              placeholder={messagePlaceholder}
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-7">
        <Button type="submit" size="lg" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
