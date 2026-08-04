import { Link } from "wouter";
import type { ReactNode } from "react";

/* Small, dependency-light presentational primitives for the AI for Kids
   module. Deliberately self-contained so the module can be lifted into a
   standalone site without dragging the parent design system along. */

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Section({
  children,
  className,
  id,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "white" | "tint" | "gradient";
}) {
  const tones = {
    white: "bg-white",
    tint: "bg-slate-50",
    gradient: "bg-gradient-to-b from-blue-50 via-purple-50 to-white",
  } as const;
  return (
    <section id={id} className={cx(tones[tone], "py-16 sm:py-24", className)}>
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-purple-700">
      {children}
    </p>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cx(
        "text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx("mt-4 max-w-3xl text-lg leading-relaxed text-slate-600", className)}>
      {children}
    </p>
  );
}

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  return (
    <As
      className={cx(
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-8",
        className,
      )}
    >
      {children}
    </As>
  );
}

type BtnProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost" | "accent";
  size?: "md" | "lg";
  className?: string;
  disabled?: boolean;
  external?: boolean;
};

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm hover:from-blue-700 hover:to-purple-700",
  accent: "bg-orange-500 text-white shadow-sm hover:bg-orange-600",
  secondary:
    "border-2 border-slate-300 bg-white text-slate-800 hover:border-blue-500 hover:text-blue-700",
  ghost: "text-blue-700 hover:bg-blue-50",
} as const;

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled,
  external,
}: BtnProps) {
  const cls = cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" ? "px-8 py-4 text-base" : "px-5 py-2.5 text-sm",
    VARIANTS[variant],
    className,
  );
  if (href && external) {
    return (
      <a className={cls} href={href} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "purple" | "teal" | "orange" | "slate";
}) {
  const tones = {
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    teal: "bg-teal-100 text-teal-800",
    orange: "bg-orange-100 text-orange-800",
    slate: "bg-slate-100 text-slate-700",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatGrid({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
        >
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-3xl font-extrabold text-transparent">
              {s.value}
            </span>
            <span className="mt-1 block text-sm font-medium text-slate-600">{s.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Honest placeholder marker — used wherever content is awaiting real data. */
export function Placeholder({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
      {children}
    </p>
  );
}

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="ml-1 text-orange-600">*</span> : null}
      </label>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? (
        <p className="mt-1.5 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";
