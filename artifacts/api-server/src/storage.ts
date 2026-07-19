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
    return db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [e] = await db.select().from(events).where(eq(events.id, id));
    return e;
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
