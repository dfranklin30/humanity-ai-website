import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { FundraisingBanner } from "@/components/fundraising-banner";
import { Footer } from "@/components/footer";
import { AiChatWidget } from "@/components/ai-chat-widget";
import { RainbowRoadBg } from "@/components/rainbow-road-bg";
import { AuthProvider } from "@/lib/auth";
import { ScrollToTop } from "@/components/scroll-to-top";
import { HelmetProvider } from "react-helmet-async";
import AiForKidsApp from "@/aiforkids/AiForKidsApp";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import About from "@/pages/about";
import Programs from "@/pages/programs";
import Blog from "@/pages/blog";
import BlogPostPage from "@/pages/blog-post";
import Events from "@/pages/events";
import AiForKidsEvent from "@/pages/ai-for-kids-event";
import AiHub from "@/pages/ai-hub";
import Contact from "@/pages/contact";
import Donate from "@/pages/donate";
import Training from "@/pages/training";
import BoardMember from "@/pages/board-member";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import AuthorDashboard from "@/pages/author-dashboard";
import PostEditor from "@/pages/post-editor";
import ProfilePage from "@/pages/profile";
import DeleteAccount from "@/pages/delete-account";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/about/board/:slug" component={BoardMember} />
      <Route path="/programs" component={Programs} />
      <Route path="/training" component={Training} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/events" component={Events} />
      <Route path="/aiforkids" component={AiForKidsEvent} />
      <Route path="/aiforkids/bereadyforai" component={AiForKidsEvent} />
      <Route path="/ai-hub" component={AiHub} />
      <Route path="/contact" component={Contact} />
      <Route path="/donate" component={Donate} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/author/dashboard" component={AuthorDashboard} />
      <Route path="/author/posts/new" component={PostEditor} />
      <Route path="/author/posts/:id/edit" component={PostEditor} />
      <Route path="/profile/:username" component={ProfilePage} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/delete-account" component={DeleteAccount} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * AI Builders Academy (/aiforkids) is a self-contained site that shares this
 * deployment and DNS but not the parent site's chrome. Anything under
 * /aiforkids renders its own layout, nav, footer and theme; everything else
 * renders the Humanity + AI site exactly as before.
 */
function Shell() {
  const [location] = useLocation();

  if (location.startsWith("/aiforkids")) {
    return <AiForKidsApp />;
  }

  return (
    <>
      <RainbowRoadBg />
      <div className="min-h-screen flex flex-col bg-transparent">
        <FundraisingBanner />
        <Navbar />
        <main className="flex-1">
          <Router />
        </main>
        <Footer />
        <AiChatWidget />
      </div>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <ScrollToTop />
              <Shell />
              <Toaster />
            </WouterRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
