import { PageMeta } from "@/components/page-meta";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  User,
  BookOpen,
  ExternalLink,
  BookMarked,
  Download,
  ArrowRight,
} from "lucide-react";
import type { BlogPost } from "@workspace/db";
import type { AuthUser } from "@/lib/auth";
import { StructuredData } from "@/components/structured-data";

type BlogPostWithAuthor = BlogPost & { authorProfile?: AuthUser | null };

function externalSiteName(url?: string | null) {
  if (!url) return "the original site";
  if (url.includes("medium.com")) return "Medium";
  if (url.includes("forbes.com") || url.includes("forbes.")) return "Forbes";
  if (url.includes("thejofia.com")) return "thejofia.com";
  return "external site";
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useQuery<BlogPostWithAuthor>({
    queryKey: ["/api/blog", slug],
  });

  if (isLoading) {
    return (
      <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <Skeleton className="h-4 w-32 mb-8 rounded-none" />
          <Skeleton className="h-3 w-48 mb-4 rounded-none" />
          <Skeleton className="h-12 w-full mb-4 rounded-none" />
          <Skeleton className="h-12 w-3/4 mb-8 rounded-none" />
          <Skeleton className="h-6 w-64 mb-12 rounded-none" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-full rounded-none" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="font-serif text-4xl font-bold mb-3">Post not found</h2>
          <p className="text-muted-foreground font-serif text-lg mb-8">
            The article you're looking for doesn't exist.
          </p>
          <Link href="/blog">
            <Button
              variant="outline"
              className="rounded-none font-serif italic gap-2 border-foreground/20"
              data-testid="button-back-to-blog"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isBook = post.contentType === "book";
  const ext = externalSiteName(post.mediumUrl);
  const formattedDate = new Date(
    post.publishedAt || post.createdAt,
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const metaTitle = post.seoTitle || post.title;
  const metaDescription = post.seoDescription || post.excerpt || `Read ${post.title} on Humanity + AI.`;
  const metaImage = post.featuredImageUrl || post.imageUrl;
  const canonicalUrl = post.mediumUrl ? post.mediumUrl : `/blog/${post.slug}`;

  const siteBase = "https://humanityplusai.org";
  const postUrl = `${siteBase}/blog/${post.slug}`;
  const authorName =
    post.authorProfile?.displayName || post.authorProfile?.username || post.author;
  const authorUrl = post.authorProfile
    ? `${siteBase}/profile/${post.authorProfile.username}`
    : undefined;

  const structuredSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": isBook ? "Book" : "BlogPosting",
    headline: metaTitle,
    description: metaDescription,
    datePublished: post.publishedAt || post.createdAt,
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Humanity + AI, Inc.",
      url: siteBase,
    },
    ...(metaImage ? { image: metaImage.startsWith("http") ? metaImage : `${siteBase}${metaImage}` } : {}),
    ...(post.tags && post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    ...(post.mediumUrl ? { sameAs: [post.mediumUrl] } : {}),
  };

  return (
    <div className="font-sans bg-[#FAF9F6] dark:bg-background text-foreground min-h-screen selection:bg-primary/20 selection:text-primary">
      <PageMeta
        title={metaTitle}
        description={metaDescription}
        canonical={canonicalUrl}
        ogType="article"
        ogImage={metaImage || undefined}
        ogImageAlt={metaTitle}
      />
      <StructuredData schema={structuredSchema} />
      {/* Issue Strip */}
      <div className="border-b border-foreground/10 max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          <Link href="/blog">
            <button
              className="flex items-center gap-2 hover:text-primary transition-colors"
              data-testid="button-back-to-blog"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to the Library
            </button>
          </Link>
          <span className="hidden sm:flex items-center gap-3">
            <span>{post.category}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </span>
        </div>
      </div>

      {/* Article Header */}
      <header className="max-w-3xl mx-auto px-4 md:px-8 pt-16 pb-12 border-b border-foreground/10">
        <div className="flex flex-wrap items-center gap-3 mb-8 text-xs uppercase tracking-widest font-bold">
          <span className="text-primary">{post.category}</span>
          {isBook && (
            <span className="border border-foreground/20 px-2 py-1 flex items-center gap-1 text-foreground">
              <BookMarked className="h-3 w-3" />
              Book
            </span>
          )}
          {post.mediumUrl && (
            <span className="border border-foreground/20 px-2 py-1 text-muted-foreground italic font-serif normal-case tracking-normal">
              Originally on {ext}
            </span>
          )}
        </div>
        <h1
          className="font-serif text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-8"
          data-testid="text-post-title"
        >
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground font-serif italic border-t border-foreground/10 pt-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            By{" "}
            {post.authorProfile ? (
              <Link
                href={`/profile/${post.authorProfile.username}`}
                className="hover:text-primary not-italic font-medium hover:underline"
                data-testid="link-author-profile"
              >
                {post.authorProfile.displayName || post.author}
              </Link>
            ) : (
              <span className="not-italic font-medium text-foreground">
                {post.author}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </div>
        </div>
      </header>

      {/* Editorial Pull Quote */}
      {post.excerpt && (
        <div className="max-w-3xl mx-auto px-4 md:px-8 pt-10 pb-6">
          <p className="font-serif italic text-xl md:text-2xl leading-relaxed text-foreground/80 border-l-2 border-primary pl-6">
            {post.excerpt}
          </p>
        </div>
      )}

      {/* Article Body */}
      <article className="max-w-3xl mx-auto px-4 md:px-8 pb-12" data-testid="content-blog-post">
        <div className="prose prose-lg dark:prose-invert max-w-none font-serif">
          {post.content.split("\n\n").map((paragraph, i) => {
            if (paragraph.startsWith("## ")) {
              return (
                <h2
                  key={i}
                  className="font-serif text-3xl font-bold mt-12 mb-5 text-foreground border-t border-foreground/10 pt-10"
                >
                  {paragraph.replace("## ", "")}
                </h2>
              );
            }
            if (paragraph.startsWith("### ")) {
              return (
                <h3
                  key={i}
                  className="font-serif text-xl font-bold mt-8 mb-3 text-foreground"
                >
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("- ") || paragraph.includes("\n- ")) {
              const items = paragraph.split("\n").filter((l) => l.startsWith("- "));
              return (
                <ul key={i} className="list-disc pl-6 space-y-2 mb-5">
                  {items.map((item, j) => (
                    <li
                      key={j}
                      className="text-muted-foreground leading-relaxed font-serif"
                    >
                      {item.replace("- ", "")}
                    </li>
                  ))}
                </ul>
              );
            }
            if (paragraph.match(/^\d+\.\s/)) {
              const items = paragraph.split("\n").filter((l) => l.match(/^\d+\.\s/));
              return (
                <ol key={i} className="list-decimal pl-6 space-y-2 mb-5">
                  {items.map((item, j) => (
                    <li
                      key={j}
                      className="text-muted-foreground leading-relaxed font-serif"
                    >
                      {item.replace(/^\d+\.\s/, "")}
                    </li>
                  ))}
                </ol>
              );
            }
            if (paragraph.startsWith("> ")) {
              return (
                <blockquote
                  key={i}
                  className="border-l-4 border-primary pl-6 italic text-foreground/80 font-serif text-xl my-8 leading-relaxed"
                >
                  {paragraph.replace("> ", "")}
                </blockquote>
              );
            }
            return (
              <p
                key={i}
                className="text-foreground/80 leading-relaxed mb-5 font-serif text-lg"
              >
                {paragraph}
              </p>
            );
          })}
        </div>

        {post.mediumUrl && (
          <div className="mt-12 p-6 border border-foreground/10 bg-primary/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">
                Read on {ext}
              </p>
              <p className="text-sm text-muted-foreground font-serif italic">
                Originally published on {ext}.
              </p>
            </div>
            <a href={post.mediumUrl} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                className="rounded-none font-serif italic gap-2 border-foreground/20"
                data-testid="link-medium-original"
              >
                <ExternalLink className="h-4 w-4" />
                Open Original
              </Button>
            </a>
          </div>
        )}

        {post.downloadUrl && (
          <div className="mt-6 p-6 border border-foreground/10 bg-primary/5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary mb-1">
                Download Resource
              </p>
              <p className="text-sm text-muted-foreground font-serif italic">
                Free PDF available from our curated AI/ML library.
              </p>
            </div>
            <a href={post.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button
                className="rounded-none font-serif italic gap-2"
                data-testid="link-download-resource"
              >
                <Download className="h-4 w-4" />
                Open Library
              </Button>
            </a>
          </div>
        )}

        {/* Author Card */}
        <div className="mt-16 pt-10 border-t border-foreground/10">
          <div className="text-xs uppercase tracking-widest font-bold text-primary mb-6">
            About the Author
          </div>
          {post.authorProfile ? (
            <Link href={`/profile/${post.authorProfile.username}`}>
              <div
                className="group cursor-pointer border-l-2 border-primary pl-6 py-2"
                data-testid="block-author-card"
              >
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                  Written by
                </p>
                <h3
                  className="font-serif text-3xl font-bold leading-tight mb-1 group-hover:text-primary transition-colors"
                  data-testid="text-author-card-name"
                >
                  {post.authorProfile.displayName ||
                    post.authorProfile.username}
                </h3>
                {(post.authorProfile.title ||
                  post.authorProfile.organization) && (
                  <p className="text-xs font-bold uppercase tracking-wide text-foreground/60 mb-4">
                    {post.authorProfile.title}
                    {post.authorProfile.title &&
                    post.authorProfile.organization
                      ? " · "
                      : ""}
                    {post.authorProfile.organization}
                  </p>
                )}
                {post.authorProfile.bio && (
                  <p className="text-sm text-muted-foreground font-serif leading-relaxed line-clamp-3 mb-4">
                    {post.authorProfile.bio}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                  View Profile
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="border-l-2 border-primary pl-6 py-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
                Written by
              </p>
              <h3 className="font-serif text-3xl font-bold leading-tight mb-1">
                {post.author}
              </h3>
              <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">
                Humanity + AI, Inc.
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-foreground/10 text-center">
          <Link href="/blog">
            <Button
              variant="ghost"
              className="rounded-none font-serif italic text-primary hover:bg-transparent hover:text-primary/80"
              data-testid="link-back-to-library"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to the Library
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
