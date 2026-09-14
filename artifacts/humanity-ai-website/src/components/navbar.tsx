import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun, Heart, User as UserIcon, LayoutDashboard, LogOut, PenSquare, LogIn } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/lib/auth";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/training", label: "Learning Hub" },
  { href: "/blog", label: "Blog" },
  { href: "/events", label: "Events" },
  { href: "/ai-hub", label: "AI Hub" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#A8751C]/20 bg-[#FFFFFF]/80 text-[#14201B] backdrop-blur supports-[backdrop-filter]:bg-[#FFFFFF]/55">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
          <img
            src="/humanity-ai-logo.png"
            alt="Humanity + AI, Inc."
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-contain"
            data-testid="img-navbar-logo"
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-serif font-bold text-sm leading-tight">Humanity + AI</span>
            <span className="text-[10px] text-[#14201B]/50 leading-tight tracking-wider uppercase">Inc.</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              size="sm"
              className={`nav-link relative text-sm font-medium tracking-wide text-[#14201B]/75 hover:bg-transparent hover:text-[#14201B] ${location === link.href ? "is-active text-[#14201B]" : ""}`}
            >
              <Link href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, '-')}`}>
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="text-[#14201B] hover:bg-[#14201B]/10 hover:text-[#14201B]"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full overflow-hidden text-[#14201B] hover:bg-[#14201B]/10" data-testid="button-user-menu">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-9 h-9 object-cover rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#f0c674]/20 text-[#A8751C] flex items-center justify-center">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="font-semibold text-sm" data-testid="text-menu-displayname">{user.displayName || user.username}</div>
                  <div className="text-xs text-muted-foreground">@{user.username}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/author/dashboard">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                </Link>
                <Link href="/author/posts/new">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-write">
                    <PenSquare className="h-4 w-4 mr-2" />
                    Write article
                  </DropdownMenuItem>
                </Link>
                <Link href={`/profile/${user.username}`}>
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                    <UserIcon className="h-4 w-4 mr-2" />
                    My profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer" data-testid="menu-logout">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden sm:flex gap-1 bg-transparent border-[#14201B]/30 text-[#14201B] hover:bg-[#14201B]/10 hover:text-[#14201B]">
              <Link href="/login" data-testid="link-signin-nav">
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
            </Button>
          )}

          <Button asChild size="sm" className="flex gap-1 font-semibold bg-[#f0c674] text-[#FBFAF7] hover:bg-[#f0c674]/90">
            <Link href="/donate" data-testid="link-donate-nav">
              <Heart className="h-3.5 w-3.5 fill-current" />
              Donate Now
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="lg:hidden text-[#14201B] hover:bg-[#14201B]/10 hover:text-[#14201B]" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant="ghost"
                    className={`w-full justify-start ${location === link.href ? "bg-accent" : ""}`}
                  >
                    <Link href={link.href} onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  </Button>
                ))}
                <div className="border-t my-3" />
                {isAuthenticated && user ? (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-start gap-2">
                      <Link href="/author/dashboard" onClick={() => setOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start gap-2">
                      <Link href="/author/posts/new" onClick={() => setOpen(false)}>
                        <PenSquare className="h-4 w-4" />
                        Write article
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start gap-2">
                      <Link href={`/profile/${user.username}`} onClick={() => setOpen(false)}>
                        <UserIcon className="h-4 w-4" />
                        My profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-start gap-2">
                      <Link href="/login" onClick={() => setOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start gap-2">
                      <Link href="/signup" onClick={() => setOpen(false)}>
                        <UserIcon className="h-4 w-4" />
                        Create account
                      </Link>
                    </Button>
                  </>
                )}
                <Button asChild className="w-full mt-4 gap-1">
                  <Link href="/donate" onClick={() => setOpen(false)}>
                    <Heart className="h-4 w-4" />
                    Donate
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
