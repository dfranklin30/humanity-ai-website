import { PageMeta } from "@/components/page-meta";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  BookMarked,
  Newspaper,
  Star,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import type { BlogPost } from "@workspace/db";

type FilterType = "all" | "article" | "book";

function externalLabel(url?: string | null) {
  if (!url) return null;
  if (url.includes("medium.com")) return "Medium";
  if (url.includes("forbes.com") || url.includes("forbes.")) return "Forbes";
  if (url.includes("thejofia.com")) return "thejofia.com";
  return "External";
}

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });
  const [filter, setFilter] = useState<FilterType>("all");

  const articles =
    posts?.filter((p) => (p.contentType || "article") === "article") || [];
  const books = posts?.filter((p) => p.contentType === "book") || [];
  const filtered = posts?.filter((p) => {
    if (filter === "all") return true;
    return (p.contentType || "article") === filter;
  });
  const featuredJofiaPost = posts?.find(
    (p) => p.slug === "jofia-cache-aware-agent-architecture",
  );

  return (
    <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      <PageMeta
        title="Thought Leadership — Articles & Books"
        description="Read expert articles, books, and insights on AI ethics, technology leadership, and the future of artificial intelligence from the Humanity + AI community."
        canonical="/blog"
      />
      {/* Magazine Masthead */}
      <header className="border-b border-foreground/10 py-6 px-4 md:px-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Blog, Books & Insights
            <Sparkles className="h-3 w-3" />
          </div>
          <h1
            className="font-serif text-5xl md:text-7xl leading-none tracking-tight text-center font-bold text-foreground"
            data-testid="text-blog-title"
          >
            Thought <span className="italic font-light text-primary">Leadership</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-widest border-t border-b border-foreground/10 py-2 w-full">
            <span>The Library</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-center">Articles · Books · Research</span>
            <span className="hidden sm:inline">•</span>
            <span>Open Access</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
        {/* Editor's Note */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 border-b border-foreground/10 pb-12 mb-12">
          <div className="lg:col-span-8">
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Editor's Note
            </div>
            <p className="font-serif text-2xl md:text-3xl leading-snug text-foreground mb-6">
              A growing collection of writing, research, and conversation from
              the{" "}
              <span className="italic">Humanity + AI, Inc.</span> board, our
              community of practitioners, and the wider field — leaders,
              builders, learners, and thinkers shaping responsible AI together.
            </p>
            <p className="text-muted-foreground leading-relaxed font-serif">
              Have a perspective, paper, or piece worth sharing? This space is
              built to amplify every voice in our community — board, partners,
              and you.
            </p>
          </div>
          <div className="lg:col-span-4 lg:border-l lg:border-foreground/10 lg:pl-12 flex flex-col justify-center space-y-4">
            <div className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Articles
              </span>
              <span className="font-serif text-3xl font-bold text-primary">
                {articles.length || "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-b border-foreground/10 pb-3">
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Books in Library
              </span>
              <span className="font-serif text-3xl font-bold text-primary">
                {books.length || "—"}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Total Pieces
              </span>
              <span className="font-serif text-3xl font-bold text-primary">
                {posts?.length || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Featured Board Member Post */}
        {featuredJofiaPost && (
          <Link href={`/blog/${featuredJofiaPost.slug}`}>
            <div
              className="group cursor-pointer border-b border-foreground/10 pb-12 mb-12"
              data-testid="card-featured-jofia-post"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-6">
                <Star className="h-4 w-4" />
                Featured Board Member Post
                <span className="text-muted-foreground font-normal normal-case tracking-normal ml-2">
                  Latest from {featuredJofiaPost.author}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                <aside className="lg:col-span-4 border-l-2 border-primary pl-6 lg:pl-8 flex flex-col justify-between py-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-3">
                      Issue Feature
                    </p>
                    {(() => {
                      const quoteLead = featuredJofiaPost.excerpt
                        ?.split(".")[0]
                        ?.trim();
                      return quoteLead ? (
                        <p className="font-serif italic text-2xl md:text-3xl leading-snug text-foreground/90 mb-6">
                          "{quoteLead}."
                        </p>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-1 mt-6">
                    <p className="font-serif text-xl font-bold text-foreground">
                      {featuredJofiaPost.author}
                    </p>
                    <p className="text-xs uppercase tracking-widest font-bold text-primary">
                      {featuredJofiaPost.category}
                    </p>
                    {featuredJofiaPost.mediumUrl && (
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground pt-1">
                        Originally on {externalLabel(featuredJofiaPost.mediumUrl)}
                      </p>
                    )}
                  </div>
                </aside>
                <div className="lg:col-span-8 lg:border-l lg:border-foreground/10 lg:pl-12">
                  <h2
                    className="font-serif text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight mb-6 group-hover:text-primary transition-colors"
                    data-testid="text-featured-title"
                  >
                    {featuredJofiaPost.title}
                  </h2>
                  <p className="text-muted-foreground font-serif text-lg leading-relaxed line-clamp-4 mb-6">
                    {featuredJofiaPost.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                    Read the Full Post
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Filters */}
        {!isLoading && posts && posts.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-foreground/10"
            data-testid="blog-filters"
          >
            <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground mr-2">
              Section
            </span>
            <button
              onClick={() => setFilter("all")}
              className={`text-xs uppercase tracking-widest font-bold border px-4 py-2 transition-colors ${
                filter === "all"
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 text-muted-foreground hover:bg-foreground hover:text-background"
              }`}
              data-testid="filter-all"
            >
              All ({posts.length})
            </button>
            <button
              onClick={() => setFilter("article")}
              className={`text-xs uppercase tracking-widest font-bold border px-4 py-2 transition-colors flex items-center gap-2 ${
                filter === "article"
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 text-muted-foreground hover:bg-foreground hover:text-background"
              }`}
              data-testid="filter-articles"
            >
              <Newspaper className="h-3.5 w-3.5" />
              Articles ({articles.length})
            </button>
            <button
              onClick={() => setFilter("book")}
              className={`text-xs uppercase tracking-widest font-bold border px-4 py-2 transition-colors flex items-center gap-2 ${
                filter === "book"
                  ? "bg-foreground text-background border-foreground"
                  : "border-foreground/20 text-muted-foreground hover:bg-foreground hover:text-background"
              }`}
              data-testid="filter-books"
            >
              <BookMarked className="h-3.5 w-3.5" />
              Books ({books.length})
            </button>
          </div>
        )}

        {/* Listing */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4 border-t border-foreground/10 pt-6">
                <Skeleton className="h-3 w-24 rounded-none" />
                <Skeleton className="h-8 w-full rounded-none" />
                <Skeleton className="h-8 w-3/4 rounded-none" />
                <Skeleton className="h-4 w-full rounded-none" />
                <Skeleton className="h-4 w-2/3 rounded-none" />
              </div>
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
            {filtered.map((post, idx) => {
              const isBook = post.contentType === "book";
              const ext = externalLabel(post.mediumUrl);
              const formattedDate = new Date(
                post.publishedAt || post.createdAt,
              ).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <article
                    className="group cursor-pointer flex flex-col h-full border-t border-foreground/15 pt-6 relative"
                    data-testid={`card-blog-${post.id}`}
                  >
                    <div className="absolute -top-px left-0 w-12 h-0.5 bg-primary transition-all duration-300 group-hover:w-24" />

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground tabular-nums">
                        № {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        {isBook && (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-foreground border border-foreground/20 px-2 py-0.5 flex items-center gap-1">
                            <BookMarked className="h-2.5 w-2.5" />
                            Book
                          </span>
                        )}
                        {ext && !isBook && (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground border border-foreground/20 px-2 py-0.5">
                            {ext}
                          </span>
                        )}
                        {!isBook && !post.mediumUrl && (
                          <span
                            className="text-[10px] uppercase tracking-widest font-bold bg-foreground text-background px-2 py-0.5 flex items-center gap-1"
                            data-testid={`badge-built-with-${post.slug}`}
                          >
                            <Sparkles className="h-2.5 w-2.5" />
                            H+AI
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs uppercase tracking-widest font-bold text-primary mb-3">
                      {post.category}
                    </div>

                    <h2
                      className="font-serif text-[1.6rem] md:text-3xl font-bold leading-[1.1] tracking-tight mb-4 group-hover:text-primary transition-colors line-clamp-4"
                      data-testid={`text-blog-title-${post.slug}`}
                    >
                      {post.title}
                    </h2>

                    <p className="text-muted-foreground font-serif text-[15px] leading-relaxed line-clamp-4 mb-6 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between border-t border-foreground/10 pt-4 mt-auto">
                      <div className="text-xs font-medium text-foreground/70 font-serif italic">
                        By <span className="not-italic font-bold text-foreground">{post.author}</span>
                        <span className="text-muted-foreground/60 not-italic"> · {formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                        {isBook ? "Details" : "Read"}
                        {ext && !isBook && <ExternalLink className="h-3 w-3" />}
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 border-t border-foreground/10">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-bold mb-2">No posts yet</h3>
            <p className="text-muted-foreground font-serif">
              Check back soon for new articles and insights.
            </p>
          </div>
        )}

        {/* Submit CTA */}
        <div className="mt-20 pt-12 border-t border-foreground/10">
          <div className="bg-foreground text-background p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
            <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <div className="text-xs uppercase tracking-widest font-bold text-primary mb-4">
                  Submit Your Voice
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-background">
                  Have something to share?
                </h2>
                <p className="text-background/70 font-serif text-lg leading-relaxed">
                  Sign in to publish articles, share research, or contribute
                  perspective to the Humanity + AI community library.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="rounded-none font-serif italic px-8 bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                    data-testid="button-blog-signup"
                  >
                    Create Account
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-none font-serif italic px-8 border-background/20 text-background hover:bg-background hover:text-foreground w-full sm:w-auto"
                    data-testid="button-blog-signin"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
