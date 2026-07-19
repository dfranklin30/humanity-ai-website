import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { ArrowRight, Edit3, FileText, Loader2, Plus, Trash2, Upload, User } from "lucide-react";
import type { BlogPost } from "@workspace/db";

function AvatarSection() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
      toast({ title: "Avatar updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-2 ring-background shadow">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName || user.username} className="w-full h-full object-cover" data-testid="img-avatar" />
        ) : (
          <User className="h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold" data-testid="text-display-name">{user.displayName || user.username}</div>
        <div className="text-xs text-muted-foreground">@{user.username}{user.title ? ` · ${user.title}` : ""}</div>
        <div className="flex items-center gap-2 mt-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} data-testid="input-avatar-file" />
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="button-upload-avatar">
            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-2" />}
            {user.avatarUrl ? "Replace avatar" : "Upload avatar"}
          </Button>
          <Link href={`/profile/${user.username}`}>
            <Button size="sm" variant="ghost" data-testid="button-view-profile">View profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileForm() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    title: user?.title || "",
    organization: user?.organization || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      displayName: user.displayName || "",
      fullName: user.fullName || "",
      bio: user.bio || "",
      title: user.title || "",
      organization: user.organization || "",
    });
  }, [user?.id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/profile", form);
      await refresh();
      toast({ title: "Profile saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Display name</Label>
        <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} data-testid="input-profile-displayname" />
      </div>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} data-testid="input-profile-fullname" />
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-profile-title" />
      </div>
      <div className="space-y-2">
        <Label>Organization</Label>
        <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} data-testid="input-profile-org" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Bio</Label>
        <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} rows={3} data-testid="input-profile-bio" />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving} data-testid="button-save-profile">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

export default function AuthorDashboard() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user]);

  const { data: posts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/me/posts"],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/me/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Post deleted" });
    },
    onError: (err: any) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "draft" | "published" }) => {
      const res = await apiRequest("PATCH", `/api/me/posts/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Saved" });
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
  });

  if (isLoading || !user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold" data-testid="text-dashboard-title">Author Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and articles.</p>
        </div>
        <Link href="/author/posts/new">
          <Button className="gap-2" data-testid="button-new-post">
            <Plus className="h-4 w-4" />
            New article
          </Button>
        </Link>
      </div>

      <Card className="p-6 space-y-6">
        <AvatarSection />
        <div className="border-t pt-6">
          <h2 className="font-semibold text-lg mb-4">Profile</h2>
          <ProfileForm />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Your articles
          </h2>
          <span className="text-xs text-muted-foreground">{posts?.length || 0} total</span>
        </div>
        {postsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">You haven't written any posts yet.</p>
            <Link href="/author/posts/new">
              <Button size="sm" className="gap-2" data-testid="button-write-first">
                <Plus className="h-4 w-4" />
                Write your first article
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => {
              const isPublished = post.status === "published";
              return (
                <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`row-post-${post.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isPublished ? "default" : "secondary"} className="text-[10px]">
                        {isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.category}</span>
                    </div>
                    <p className="font-medium truncate" data-testid={`text-post-title-${post.id}`}>{post.title}</p>
                    <p className="text-xs text-muted-foreground truncate">/blog/{post.slug}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isPublished && (
                      <Link href={`/blog/${post.slug}`}>
                        <Button size="sm" variant="ghost" data-testid={`button-view-${post.id}`}>View</Button>
                      </Link>
                    )}
                    <Link href={`/author/posts/${post.id}/edit`}>
                      <Button size="sm" variant="outline" data-testid={`button-edit-${post.id}`}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => publishMutation.mutate({ id: post.id, status: isPublished ? "draft" : "published" })}
                      disabled={publishMutation.isPending}
                      data-testid={`button-toggle-${post.id}`}
                    >
                      {isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                          deleteMutation.mutate(post.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${post.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
