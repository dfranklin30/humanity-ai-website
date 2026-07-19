import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

/**
 * Single source of truth for the backend.
 *
 * Native builds always talk to the live Humanity + AI website API.
 * The dev web preview (Expo web inside Replit) talks to the local dev
 * API instead, since the production deployment does not yet send CORS
 * headers for browser-based cross-origin requests.
 */
const PRODUCTION_ORIGIN = "https://humanityplusai.org";

const devWebOrigin =
  __DEV__ && Platform.OS === "web" && process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : undefined;

export const API_BASE_URL = devWebOrigin ?? PRODUCTION_ORIGIN;
export const SITE_URL = PRODUCTION_ORIGIN;

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  subtitle: string | null;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  tags: string[] | null;
  imageUrl: string | null;
  featuredImageUrl: string | null;
  mediumUrl: string | null;
  downloadUrl: string | null;
  contentType: string | null;
  noImage: boolean | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface EventItem {
  id: number;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  time: string;
  location: string;
  type: string;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
  link: string | null;
  recordingUrl: string | null;
  speakerName: string | null;
  speakerProfileUrl: string | null;
  createdAt: string;
}

/** The API returns relative /uploads/... paths; prefix them with the site origin. */
export function absoluteUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return /^https?:\/\//.test(path) ? path : `${API_BASE_URL}${path}`;
}

export function isLumaLink(link: string | null | undefined): boolean {
  return !!link && /^https?:\/\/(www\.)?(luma\.com|lu\.ma)\//.test(link);
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`Request to ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function useBlogPosts() {
  return useQuery<BlogPost[]>({
    queryKey: ["blog"],
    queryFn: () => fetchJson<BlogPost[]>("/api/blog"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEvents() {
  return useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: () => fetchJson<EventItem[]>("/api/events"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Formats a YYYY-MM-DD string as e.g. "May 1, 2026" without timezone drift. */
export function formatEventDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPostDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Local YYYY-MM-DD for date-only comparisons. */
export function todayString(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}
