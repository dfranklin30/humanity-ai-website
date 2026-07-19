import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  displayName: text("display_name"),
  bio: text("bio"),
  title: text("title"),
  organization: text("organization"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("author"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(40, "Username too long").regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, underscore, and dash"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Please enter your full name"),
  displayName: z.string().min(2, "Please enter a display name"),
}).omit({
  id: true,
  createdAt: true,
  role: true,
  avatarUrl: true,
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  fullName: z.string().min(2).optional(),
  bio: z.string().max(500).optional().nullable(),
  title: z.string().max(120).optional().nullable(),
  organization: z.string().max(120).optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username or email required"),
  password: z.string().min(1, "Password required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertContactSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  amount: integer("amount").notNull(),
  message: text("message"),
  isRecurring: boolean("is_recurring").default(false),
  stripeSessionId: text("stripe_session_id").unique(),
  campaignSlug: text("campaign_slug"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  createdAt: true,
});

export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

// Fundraising campaigns — one per program/project plus the AI Training Fund.
// `raisedCents` is computed at read time from attributed donations, not stored.
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("project"), // "project" | "fund"
  goalCents: integer("goal_cents").notNull().default(10000000),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertNewsletterSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  createdAt: true,
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull(),
  authorId: varchar("author_id").references(() => users.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  tags: text("tags").array(),
  imageUrl: text("image_url"),
  featuredImageUrl: text("featured_image_url"),
  mediumUrl: text("medium_url"),
  downloadUrl: text("download_url"),
  contentType: text("content_type").default("article"),
  status: text("status").notNull().default("published"),
  published: boolean("published").default(true),
  seoTitle: text("seo_title"),
  noImage: boolean("no_image").default(false),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const createPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title too long"),
  subtitle: z.string().max(280).optional().nullable(),
  excerpt: z.string().min(10, "Summary must be at least 10 characters").max(500, "Summary too long"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  category: z.string().min(2, "Please choose a category"),
  tags: z.array(z.string().min(1).max(30)).max(10, "Up to 10 tags").optional().default([]),
  featuredImageUrl: z.string().optional().nullable(),
  noImage: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).default("draft"),
  slug: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .refine((v) => v === undefined || /^[a-z0-9-]+$/.test(v), {
      message: "Slug may contain lowercase letters, numbers, and dashes only",
    })
    .refine((v) => v === undefined || v.length >= 3, {
      message: "Slug must be at least 3 characters",
    }),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull(),
  imageUrl: text("image_url"),
  secondaryImageUrl: text("secondary_image_url"),
  link: text("link"),
  recordingUrl: text("recording_url"),
  speakerName: text("speaker_name"),
  speakerProfileUrl: text("speaker_profile_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export const eventSignups = pgTable("event_signups", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertEventSignupSchema = createInsertSchema(eventSignups, {
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().min(2, "Please enter your full name"),
}).omit({
  id: true,
  createdAt: true,
});

export type EventSignup = typeof eventSignups.$inferSelect;
export type InsertEventSignup = z.infer<typeof insertEventSignupSchema>;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset link"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
