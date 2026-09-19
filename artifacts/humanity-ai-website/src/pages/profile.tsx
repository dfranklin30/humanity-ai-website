import { PageMeta } from "@/components/page-meta";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Calendar, BookOpen, User as UserIcon } from "lucide-react";
import type { BlogPost } from "@workspace/db";
import type { AuthUser } from "@/lib/auth";
import { StructuredData } from "@/components/structured-data";

type ProfileResponse = {
  profile: AuthUser;
  posts: BlogPost[];
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile", username],
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <UserIcon className="h-12 w-12 text-[#8A9A92] mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2 text-[#14201B]">Profile not found</h2>
        <p className="text-[#4B5F55] mb-6">We couldn't find that author.</p>
        <Link href="/blog">
          <Button variant="outline" className="gap-2 text-[#14201B] hover:text-[#14201B] border-black/15">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  const { profile, posts } = data;
  const profileName = profile.displayName || profile.username;
  const profileDesc = profile.bio
    ? `${profileName} — ${profile.bio}`
    : `Author profile for ${profileName} on Humanity + AI, Inc. Read their articles and insights on AI, ethics, and technology.`;

  const siteBase = "https://humanityplusai.org";
  const profileUrl = `${siteBase}/profile/${profile.username}`;
  const displayName = profile.displayName || profile.username;
  const avatarUrl = profile.avatarUrl
    ? profile.avatarUrl.startsWith("http")
      ? profile.avatarUrl
      : `${siteBase}${profile.avatarUrl}`
    : undefined;

  const personEntity: Record<string, unknown> = {
    "@type": "Person",
    name: displayName,
    url: profileUrl,
    ...(profile.bio ? { description: profile.bio } : {}),
    ...(profile.title ? { jobTitle: profile.title } : {}),
    ...(profile.organization ? { worksFor: { "@type": "Organization", name: profile.organization } } : {}),
    ...(avatarUrl ? { image: avatarUrl } : {}),
  };

  if (posts.length > 0) {
    personEntity.author = posts.map((p) => ({
      "@type": "CreativeWork",
      name: p.title,
      url: `${siteBase}/blog/${p.slug}`,
    }));
  }

  const profileSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${displayName} — Author Profile`,
    url: profileUrl,
    mainEntity: personEntity,
  };

  return (
    <div>
      <PageMeta
        title={`${profileName} — Author Profile`}
        description={profileDesc.slice(0, 160)}
        canonical={`/profile/${profile.username}`}
        ogType="profile"
        ogImage={profile.avatarUrl || undefined}
        ogImageAlt={profileName}
      />
      <StructuredData schema={profileSchema} />
      <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-accent/10 border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="gap-2 mb-4" data-testid="button-back-blog">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-4 ring-background shadow-lg bg-muted flex items-center justify-center">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName || profile.username} className="w-full h-full object-cover" data-testid="img-profile-avatar" />
              ) : (
                <UserIcon className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-3xl font-bold" data-testid="text-profile-name">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-profile-handle">@{profile.username}</p>
              {(profile.title || profile.organization) && (
                <p className="text-sm text-primary font-medium mt-2">
                  {profile.title}
                  {profile.title && profile.organization ? " · " : ""}
                  {profile.organization}
                </p>
              )}
              {profile.bio && (
                <p className="text-base text-muted-foreground leading-relaxed mt-3 max-w-2xl" data-testid="text-profile-bio">
                  {profile.bio}
                </p>
              )}
              {profile.role === "admin" && (
                <Badge className="mt-3" variant="outline">Admin</Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-xl font-bold mb-6 flex items-center gap-2 text-[#14201B]">
            <BookOpen className="h-4 w-4 text-emerald-700" />
            Articles by {profile.displayName || profile.username}
            <span className="text-sm text-[#5B6F65] font-normal">({posts.length})</span>
          </h2>

          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No published articles yet.</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full p-5 hover-elevate cursor-pointer" data-testid={`card-profile-post-${post.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`text-profile-post-title-${post.id}`}>{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center text-xs text-primary font-medium mt-4 gap-1">
                      Read more <ArrowRight className="h-3 w-3" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
