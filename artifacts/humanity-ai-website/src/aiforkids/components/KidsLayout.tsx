import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Mail, Phone } from "lucide-react";
import { BASE, NAV, ORG, PROGRAM } from "../content/program";
import { Button, cx } from "./ui";

export function asset(file: string) {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  return `${base}/${file}`;
}

/**
 * The academy reuses the parent site's logo file rather than shipping its own
 * copy, so the two sites never drift apart. The footer needs a white version;
 * the mark is a single colour on transparency, so a filter is exact and saves
 * a second download.
 */
export function Logo({ variant = "ink" }: { variant?: "ink" | "white" }) {
  return (
    <img
      src={asset("humanity-ai-logo.png")}
      alt={`${ORG.name} logo`}
      className={cx("h-10 w-auto sm:h-11", variant === "white" ? "brightness-0 invert" : "brightness-0")}
      width={512}
      height={453}
      loading={variant === "white" ? "lazy" : "eager"}
      decoding="async"
    />
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  return (
    <>
      {NAV.map((item) => {
        const active =
          item.href === BASE ? location === BASE || location === `${BASE}/` : location.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cx(
              "rounded-full px-3 py-2 text-sm font-semibold transition",
              active ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-3 sm:px-8">
        <Link href={BASE} className="flex shrink-0 items-center gap-3" aria-label="AI Builders Academy home">
          <Logo />
          <span className="hidden leading-tight sm:block">
            <span className="block text-base font-extrabold tracking-tight text-slate-900">
              AI Builders Academy
            </span>
            <span className="block text-xs font-medium text-slate-500">by {ORG.shortName}</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
          <NavLinks />
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <Button href={`${BASE}/enroll`} className="hidden sm:inline-flex" variant="primary">
            Enroll Now
          </Button>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="kids-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open ? (
        <div id="kids-mobile-nav" className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Main">
            <NavLinks onNavigate={() => setOpen(false)} />
            <Button href={`${BASE}/enroll`} className="mt-3 w-full" size="lg">
              Enroll Now
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo variant="white" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {PROGRAM.name} is a program of {ORG.name} — a {ORG.status} whose mission is simple:{" "}
              <span className="text-slate-200">{ORG.mission}</span>
            </p>
            <div className="mt-5 space-y-2 text-sm">
              <a
                className="flex items-center gap-2 hover:text-white"
                href={`mailto:${ORG.email}`}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {ORG.email}
              </a>
              <a className="flex items-center gap-2 hover:text-white" href={`tel:${ORG.phone.replace(/\D/g, "")}`}>
                <Phone className="h-4 w-4" aria-hidden="true" />
                {ORG.phone}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Academy</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV.slice(1, 7).map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              {ORG.shortName}
            </h2>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Main website
                </Link>
              </li>
              <li>
                <Link href="/donate" className="hover:text-white">
                  Donate
                </Link>
              </li>
              <li>
                <Link href={`${BASE}/scholarships`} className="hover:text-white">
                  Scholarships
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {ORG.name}. {PROGRAM.name} is delivered by {ORG.shortName}{" "}
            instructors. Student information is never sold.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
      <a
        href="#kids-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-blue-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main id="kids-main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
