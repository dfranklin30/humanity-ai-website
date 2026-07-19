import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Send, Upload, X, ArrowLeft, Eye, Sparkles, RefreshCw, ImageOff, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BlogPost } from "@workspace/db";

const CATEGORIES = [
  "AI Ethics",
  "AI Governance",
  "Agentic Systems",
  "Machine Learning",
  "Quantum Computing",
  "Defense Technology",
  "Interspecies Communication",
  "Tech Leadership",
  "Education",
  "Community",
  "Research",
  "Other",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type EditorState = {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category: string;
  tagInput: string;
  tags: string[];
  featuredImageUrl: string | null;
  noImage: boolean;
  slug: string;
  slugTouched: boolean;
  seoTitle: string;
  seoDescription: string;
};

export default function PostEditor() {
  const params = useParams<{ id?: string }>();
  const editingId = params.id ? parseInt(params.id, 10) : null;
  const isNew = !editingId;
  const [, navigate] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [generatingAiImage, setGeneratingAiImage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user]);

  const { data: existing, isLoading: loadingPost } = useQuery<BlogPost>({
    queryKey: ["/api/me/posts", editingId],
    enabled: !!editingId && !!user,
  });

  const [state, setState] = useState<EditorState>({
    title: "",
    subtitle: "",
    excerpt: "",
    content: "",
    category: "AI Ethics",
    tagInput: "",
    tags: [],
    featuredImageUrl: null,
    noImage: true,
    slug: "",
    slugTouched: false,
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    if (existing) {
      setState({
        title: existing.title,
        subtitle: existing.subtitle || "",
        excerpt: existing.excerpt,
        content: existing.content,
        category: existing.category,
        tagInput: "",
        tags: existing.tags || [],
        featuredImageUrl: existing.featuredImageUrl || existing.imageUrl || null,
        noImage: existing.noImage ?? false,
        slug: existing.slug,
        slugTouched: true,
        seoTitle: existing.seoTitle || "",
        seoDescription: existing.seoDescription || "",
      });
    }
  }, [existing?.id]);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((s) => {
      const next = { ...s, [key]: value };
      if (key === "title" && !s.slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function addTag() {
    const t = state.tagInput.trim();
    if (!t) return;
    if (state.tags.includes(t)) return;
    if (state.tags.length >= 10) {
      toast({ title: "Up to 10 tags allowed", variant: "destructive" });
      return;
    }
    setState((s) => ({ ...s, tags: [...s.tags, t], tagInput: "" }));
  }

  function removeTag(t: string) {
    setState((s) => ({ ...s, tags: s.tags.filter((x) => x !== t) }));
  }

  async function generateAiImage() {
    if (!state.title.trim()) {
      toast({ title: "Add a title first", description: "The AI needs your article title to generate a relevant image.", variant: "destructive" });
      return;
    }
    setGeneratingAiImage(true);
    try {
      const res = await fetch("/api/me/posts/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: state.title.trim(),
          excerpt: state.excerpt.trim(),
          category: state.category,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(data.error || "Generation failed");
      }
      const { url } = await res.json();
      update("featuredImageUrl", url);
      update("noImage", false);
      toast({ title: "AI image generated", description: "A unique image has been created for your post." });
    } catch (err: any) {
      toast({ title: "Image generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingAiImage(false);
    }
  }

  async function uploadFeaturedImage(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/me/posts/upload-image", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      update("featuredImageUrl", url);
      toast({ title: "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      const payload = {
        title: state.title.trim(),
        subtitle: state.subtitle.trim() || null,
        excerpt: state.excerpt.trim(),
        content: state.content,
        category: state.category,
        tags: state.tags,
        featuredImageUrl: null,
        noImage: true,
        slug: state.slug || undefined,
        seoTitle: state.seoTitle.trim() || null,
        seoDescription: state.seoDescription.trim() || null,
        status,
      };
      const res = isNew
        ? await apiRequest("POST", "/api/me/posts", payload)
        : await apiRequest("PATCH", `/api/me/posts/${editingId}`, payload);
      return (await res.json()) as BlogPost;
    },
    onSuccess: (post, status) => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({
        title: status === "published" ? "Article published" : "Draft saved",
        description: status === "published" ? `Live at /blog/${post.slug}` : "You can keep editing or publish later.",
      });
      if (isNew) navigate(`/author/posts/${post.id}/edit`);
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err.message?.replace(/^\d+:\s*/, "") || String(err), variant: "destructive" });
    },
  });

  if (authLoading || (editingId && loadingPost)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <Link href="/author/dashboard">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && existing && existing.status === "published" && (
            <Link href={`/blog/${existing.slug}`}>
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-view-live">
                <Eye className="h-4 w-4" />
                View live
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate("draft")}
            disabled={saveMutation.isPending}
            data-testid="button-save-draft"
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save draft
          </Button>
          <Button
            onClick={() => saveMutation.mutate("published")}
            disabled={saveMutation.isPending}
            data-testid="button-publish"
            className="gap-2"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {!isNew && existing?.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>

      <h1 className="font-serif text-2xl font-bold mb-6" data-testid="text-editor-title">
        {isNew ? "Write a new article" : "Edit article"}
      </h1>

      <Card className="p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="post-title">Title *</Label>
          <Input
            id="post-title"
            value={state.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="A clear, compelling title"
            className="text-lg"
            data-testid="input-post-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-subtitle">Subtitle / Summary line (optional)</Label>
          <Input
            id="post-subtitle"
            value={state.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="A short hook displayed under the title"
            data-testid="input-post-subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label>Article presentation</Label>
          <div className="border rounded-lg p-4 bg-muted/30 flex items-start gap-3" data-testid="notice-no-images">
            <ImageOff className="h-5 w-5 text-muted-foreground/60 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Image-free editorial style</p>
              <p>All articles on Humanity + AI now publish in a clean, title-and-author format — your headline and byline are the focus. No image is needed.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="post-category">Category *</Label>
            <select
              id="post-category"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={state.category}
              onChange={(e) => update("category", e.target.value)}
              data-testid="select-post-category"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="post-slug">URL slug</Label>
            <Input
              id="post-slug"
              value={state.slug}
              onChange={(e) => setState((s) => ({ ...s, slug: slugify(e.target.value), slugTouched: true }))}
              placeholder="auto-generated-from-title"
              data-testid="input-post-slug"
            />
            <p className="text-xs text-muted-foreground">/blog/{state.slug || "your-article-slug"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex items-center gap-2">
            <Input
              value={state.tagInput}
              onChange={(e) => setState((s) => ({ ...s, tagInput: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type a tag and press Enter"
              data-testid="input-tag"
            />
            <Button type="button" variant="outline" onClick={addTag} data-testid="button-add-tag">Add</Button>
          </div>
          {state.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {state.tags.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1" data-testid={`tag-${t}`}>
                  {t}
                  <button type="button" onClick={() => removeTag(t)} className="ml-1 opacity-60 hover:opacity-100">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-excerpt">Summary / excerpt *</Label>
          <Textarea
            id="post-excerpt"
            value={state.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
            placeholder="Two or three sentences that summarize your article"
            rows={3}
            maxLength={500}
            data-testid="input-post-excerpt"
          />
          <p className="text-xs text-muted-foreground">{state.excerpt.length}/500</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="post-content">Content *</Label>
          <Textarea
            id="post-content"
            value={state.content}
            onChange={(e) => update("content", e.target.value)}
            placeholder={`Write your article here.\n\nUse blank lines between paragraphs.\n## Use ## for section headings\n- Bullet points start with a dash\n> Quotes start with >`}
            rows={20}
            className="font-mono text-sm leading-relaxed"
            data-testid="input-post-content"
          />
          <p className="text-xs text-muted-foreground">
            Plain text with simple markdown-style formatting: blank lines for paragraphs, <code>##</code> for headings, <code>-</code> for bullets, <code>&gt;</code> for quotes.
          </p>
        </div>

        <div className="border-t pt-5 space-y-4">
          <h3 className="font-semibold text-sm">SEO (optional)</h3>
          <div className="space-y-2">
            <Label htmlFor="seo-title">SEO title</Label>
            <Input
              id="seo-title"
              value={state.seoTitle}
              onChange={(e) => update("seoTitle", e.target.value)}
              placeholder="Defaults to article title"
              maxLength={120}
              data-testid="input-seo-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo-description">SEO description</Label>
            <Textarea
              id="seo-description"
              value={state.seoDescription}
              onChange={(e) => update("seoDescription", e.target.value)}
              placeholder="Defaults to summary"
              maxLength={300}
              rows={2}
              data-testid="input-seo-description"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
