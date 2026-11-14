import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import {
  users, type User, type InsertUser,
  contactSubmissions, type ContactSubmission, type InsertContact,
  donations, type Donation, type InsertDonation,
  campaigns, type Campaign, type InsertCampaign,
  newsletterSubscribers, type NewsletterSubscriber, type InsertNewsletter,
  blogPosts, type BlogPost, type InsertBlogPost,
  conversations, type Conversation, type InsertConversation,
  messages, type Message, type InsertMessage,
  events, type Event, type InsertEvent,
  eventSignups, type EventSignup, type InsertEventSignup,
  passwordResetTokens, type PasswordResetToken,
} from "@workspace/db";

// Cancelled events, matched on their natural key (title prefix + date). They
// are hidden from every listing and refuse new sign-ups, but the row is NOT
// deleted: event_signups cascades on delete, and the registrations for a
// cancelled event are kept so they can still be followed up.
const CANCELLED_EVENTS: { titlePrefix: string; date: string }[] = [
  // 2026-10-23 podcast with Doug Loyo: cancelled, guest never confirmed.
  { titlePrefix: "Humanity + AI Podcasts: Running an AI Startup from Orlando", date: "2026-10-23" },
];

// Retired listings, matched the same way. These AI Discussion Club events were
// cross-listed while William Zhu served on the board (through November 2026);
// they stay in the database but are no longer shown.
const RETIRED_EVENTS: { titlePrefix: string; date: string }[] = [
  { titlePrefix: "Podcast Discussion: Risks of AI becoming smarter than humans - web inventor Sir Tim Berners-Lee", date: "2025-11-08" },
  { titlePrefix: "Podcast Discussion: The Experimentation Machine: How AI is Creating 10x Founders | Jeffrey Bussgang", date: "2025-12-06" },
  { titlePrefix: "Discussion: The Optimist: Sam Altman, Y Combinator, and OpenAI", date: "2026-01-17" },
  { titlePrefix: "Podcast Discussion: Spatial Intelligence is the Next Frontier in AI | Dr. Fei-Fei Li", date: "2026-02-21" },
  { titlePrefix: "Podcast Discussion: Dario Amodei “We are near the end of the exponential”", date: "2026-03-07" },
  { titlePrefix: "Podcast Discussion: Google: The AI Company", date: "2026-03-14" },
  { titlePrefix: "Outdoor Discussion Walk: The Secrets of Claude Code", date: "2026-03-28" },
  { titlePrefix: "Outdoor Discussion Walk: AI and the Future of Work / Jobs", date: "2026-04-18" },
  { titlePrefix: "Outdoor Discussion Walk: Jensen Huang and Nvidia", date: "2026-05-02" },
  { titlePrefix: "Outdoor Discussion Walk: OpenClaw and Autonomous Agents", date: "2026-05-24" },
  { titlePrefix: "AI in Marketing: AR Filters are the New Billboard", date: "2026-05-30" },
  { titlePrefix: "Outdoor Discussion Walk: WALL-E and the Future of AI", date: "2026-06-06" },
  { titlePrefix: "Mall Discussion Walk: How Anthropic, Costco, and Patagonia Build Incorruptible Companies", date: "2026-06-21" },
  { titlePrefix: "Museum Discussion Walk: Perfect Search for an Agentic Internet | Exa", date: "2026-07-11" },
  { titlePrefix: "Builder Nights: Show your AI Projects, Learn from the Best Minds in AI", date: "2026-07-16" },
  { titlePrefix: "Museum Discussion: What happens after coding is solved? | Fiona Fung", date: "2026-07-26" },
  { titlePrefix: "Build with Claude 101: From Idea to Working Prototype (No Coding Experience Needed)", date: "2026-08-08" },
  { titlePrefix: "Museum Discussion: Product Management in the Age of AI", date: "2026-08-29" },
  { titlePrefix: "Build your first website in 2 Hours with Claude & Vercel (Beginner friendly)", date: "2026-09-17" },
  { titlePrefix: "Author Book Talk: Who is in Charge? Why AI Must Remain Under Human Control", date: "2026-09-19" },
  { titlePrefix: "Picnic Discussion: The rise of AI teammates | Tara Seshan", date: "2026-09-27" },
  { titlePrefix: "Outdoor Discussion Walk: AI for Scientific Research | Terence Tao", date: "2026-10-10" },
  { titlePrefix: "AI-Powered Growth Workshop: Outreach, Pipeline, and Getting Found by AI (DCSTW)", date: "2026-10-20" },
  { titlePrefix: "Outdoor Discussion Walk: Future of AI Education | a16z Academy", date: "2026-10-24" },
  { titlePrefix: "Author Book Talk: How to Build an Undeniable Career in the Age of AI", date: "2026-10-28" },
  { titlePrefix: "Design Stunning Websites Workshop", date: "2026-11-03" },
  { titlePrefix: "Build a Website with ChatGPT (Beginner Friendly)", date: "2026-11-21" },
  { titlePrefix: "Outdoor Discussion Walk : The Race to Superintelligence", date: "2026-12-05" },
];

function isCancelledEvent(e: Pick<Event, "title" | "date">): boolean {
  return [...CANCELLED_EVENTS, ...RETIRED_EVENTS].some(
    (c) => e.date === c.date && e.title.startsWith(c.titlePrefix),
  );
}

export type CreateUserDb = Omit<InsertUser, "password"> & { password: string };
export type ProfileUpdate = Partial<Pick<User, "displayName" | "fullName" | "bio" | "title" | "organization" | "avatarUrl">>;
export type PostUpdate = Partial<Omit<InsertBlogPost, "authorId">>;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: CreateUserDb): Promise<User>;
  updateUserProfile(id: string, updates: ProfileUpdate): Promise<User | undefined>;
  createContact(contact: InsertContact): Promise<ContactSubmission>;
  getContacts(): Promise<ContactSubmission[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(): Promise<Donation[]>;
  getDonationByStripeSessionId(sessionId: string): Promise<Donation | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  getCampaignBySlug(slug: string): Promise<Campaign | undefined>;
  seedCampaign(campaign: InsertCampaign): Promise<void>;
  getRaisedByCampaign(): Promise<Record<string, { raisedCents: number; donorCount: number }>>;
  createNewsletterSubscriber(sub: InsertNewsletter): Promise<NewsletterSubscriber>;
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, updates: PostUpdate): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<void>;
  getPostsByAuthor(authorId: string, opts?: { includeDrafts?: boolean }): Promise<BlogPost[]>;
  getPostsByAuthorUsername(username: string): Promise<BlogPost[]>;
  isSlugTaken(slug: string, excludeId?: number): Promise<boolean>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
  getEvents(): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  getEventByTitleAndDate(title: string, date: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  createEventSignup(signup: InsertEventSignup): Promise<EventSignup>;
  getEventSignups(eventId: number): Promise<EventSignup[]>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;
  getPublicAuthors(): Promise<Pick<User, "username">[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: CreateUserDb): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: string, updates: ProfileUpdate): Promise<User | undefined> {
    if (Object.keys(updates).length === 0) return this.getUser(id);
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createContact(contact: InsertContact): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(contact).returning();
    return submission;
  }

  async getContacts(): Promise<ContactSubmission[]> {
    return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [d] = await db.insert(donations).values(donation).returning();
    return d;
  }

  async getDonations(): Promise<Donation[]> {
    return db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async getDonationByStripeSessionId(sessionId: string): Promise<Donation | undefined> {
    const [d] = await db.select().from(donations).where(eq(donations.stripeSessionId, sessionId));
    return d;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.active, true))
      .orderBy(campaigns.sortOrder);
  }

  async getCampaignBySlug(slug: string): Promise<Campaign | undefined> {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.slug, slug));
    return c;
  }

  async seedCampaign(campaign: InsertCampaign): Promise<void> {
    await db.insert(campaigns).values(campaign).onConflictDoNothing({ target: campaigns.slug });
  }

  async getRaisedByCampaign(): Promise<Record<string, { raisedCents: number; donorCount: number }>> {
    const rows = await db
      .select({
        slug: donations.campaignSlug,
        raisedCents: sql<number>`coalesce(sum(${donations.amount}), 0)`,
        donorCount: sql<number>`count(*)`,
      })
      .from(donations)
      .where(sql`${donations.campaignSlug} is not null`)
      .groupBy(donations.campaignSlug);
    const map: Record<string, { raisedCents: number; donorCount: number }> = {};
    for (const r of rows) {
      if (!r.slug) continue;
      map[r.slug] = {
        raisedCents: Number(r.raisedCents) || 0,
        donorCount: Number(r.donorCount) || 0,
      };
    }
    return map;
  }

  async createNewsletterSubscriber(sub: InsertNewsletter): Promise<NewsletterSubscriber> {
    const [s] = await db.insert(newsletterSubscribers).values(sub).returning();
    return s;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return db
      .select()
      .from(blogPosts)
      .where(or(eq(blogPosts.status, "published"), eq(blogPosts.published, true)))
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [p] = await db.insert(blogPosts).values(post).returning();
    return p;
  }

  async updateBlogPost(id: number, updates: PostUpdate): Promise<BlogPost | undefined> {
    const [p] = await db
      .update(blogPosts)
      .set({ ...updates, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(blogPosts.id, id))
      .returning();
    return p;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async getPostsByAuthor(authorId: string, opts: { includeDrafts?: boolean } = {}): Promise<BlogPost[]> {
    if (opts.includeDrafts) {
      return db.select().from(blogPosts).where(eq(blogPosts.authorId, authorId)).orderBy(desc(blogPosts.updatedAt));
    }
    return db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.authorId, authorId),
          or(eq(blogPosts.status, "published"), eq(blogPosts.published, true)),
        ),
      )
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
  }

  async getPostsByAuthorUsername(username: string): Promise<BlogPost[]> {
    const author = await this.getUserByUsername(username);
    if (!author) return [];
    return this.getPostsByAuthor(author.id);
  }

  async isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
    const rows = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug));
    if (rows.length === 0) return false;
    if (excludeId !== undefined && rows.every((r) => r.id === excludeId)) return false;
    return true;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conv;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  }

  async createConversation(title: string): Promise<Conversation> {
    const [conv] = await db.insert(conversations).values({ title }).returning();
    return conv;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [msg] = await db.insert(messages).values({ conversationId, role, content }).returning();
    return msg;
  }

  async getEvents(): Promise<Event[]> {
    const rows = await db.select().from(events).orderBy(desc(events.createdAt));
    return rows.filter((e) => !isCancelledEvent(e));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [e] = await db.select().from(events).where(eq(events.id, id));
    return e && !isCancelledEvent(e) ? e : undefined;
  }

  /** Look an event up by its natural key, for clients holding a stale id. */
  async getEventByTitleAndDate(title: string, date: string): Promise<Event | undefined> {
    const [e] = await db
      .select()
      .from(events)
      .where(and(eq(events.title, title), eq(events.date, date)))
      .limit(1);
    return e && !isCancelledEvent(e) ? e : undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [e] = await db.insert(events).values(event).returning();
    return e;
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db.update(users).set({ password: passwordHash }).where(eq(users.id, id));
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [row] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
    return row;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    return row;
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, id));
  }

  async createEventSignup(signup: InsertEventSignup): Promise<EventSignup> {
    const [s] = await db.insert(eventSignups).values(signup).returning();
    return s;
  }

  async getEventSignups(eventId: number): Promise<EventSignup[]> {
    return db.select().from(eventSignups).where(eq(eventSignups.eventId, eventId)).orderBy(desc(eventSignups.createdAt));
  }

  async getPublicAuthors(): Promise<Pick<User, "username">[]> {
    const rows = await db
      .selectDistinct({ username: users.username })
      .from(users)
      .innerJoin(blogPosts, eq(blogPosts.authorId, users.id))
      .where(
        or(
          eq(blogPosts.status, "published"),
          eq(blogPosts.published, true),
        ),
      );
    return rows;
  }
}

export const storage = new DatabaseStorage();
