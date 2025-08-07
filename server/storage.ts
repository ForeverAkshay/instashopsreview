import { InsertUser, InsertBrand, InsertReview, InsertCategory, InsertContactMessage, UpdateBrandStatus, User, Brand, Review, Category, ContactMessage, ReviewWithUser, users, brands, reviews, categories, contactMessages } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db, pool } from "./db";
import { eq, ilike, and, or, desc } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PgSessionStore = connectPgSimple(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Brand operations
  getBrand(id: number): Promise<Brand | undefined>;
  getBrandByInstagramHandle(handle: string): Promise<Brand | undefined>;
  getBrands(): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]>;
  getBrandsByCategory(categoryId: number): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]>;
  searchBrands(query: string): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrandStatus(id: number, status: UpdateBrandStatus): Promise<Brand | undefined>;
  getPendingBrands(): Promise<(Brand & { categoryName?: string })[]>;

  // Review operations
  getReview(id: number): Promise<Review | undefined>;
  getReviewsByBrand(brandId: number): Promise<ReviewWithUser[]>;
  getUserReviewForBrand(userId: number, brandId: number): Promise<Review | undefined>;
  createReview(review: InsertReview & { userId: number }): Promise<Review>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Contact message operations
  getContactMessages(): Promise<ContactMessage[]>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  
  // Admin operations
  createAdminUser(): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private brands: Map<number, Brand>;
  private reviews: Map<number, Review>;
  private categories: Map<number, Category>;
  private contactMessages: Map<number, ContactMessage>;
  private currentIds: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.brands = new Map();
    this.reviews = new Map();
    this.categories = new Map();
    this.contactMessages = new Map();
    this.currentIds = { users: 1, brands: 1, reviews: 1, categories: 1, contactMessages: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize with some categories
    const defaultCategories = [
      "Gymwear",
      "Home Appliances",
      "Accessories",
      "Beauty Products",
      "Fashion",
      "Food & Beverages",
      "Tech Gadgets",
      "Art & Crafts",
    ];

    defaultCategories.forEach((name) => {
      this.createCategory({ name });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    const user = { 
      ...insertUser, 
      id, 
      createdAt: now,
      isAdmin: insertUser.isAdmin ?? null 
    };
    this.users.set(id, user);
    return user;
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async getBrandByInstagramHandle(handle: string): Promise<Brand | undefined> {
    return Array.from(this.brands.values()).find(
      (brand) => brand.instagramHandle === handle,
    );
  }

  async getBrands(): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    return Array.from(this.brands.values())
      .filter(brand => brand.status === 'approved') // Only show approved brands
      .map(brand => {
        const brandReviews = Array.from(this.reviews.values()).filter(r => r.brandId === brand.id);
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;
        const category = this.categories.get(brand.categoryId);
        
        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: category?.name,
        };
      });
  }

  async getBrandsByCategory(categoryId: number): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    return Array.from(this.brands.values())
      .filter((brand) => brand.categoryId === categoryId && brand.status === 'approved') // Only show approved brands
      .map(brand => {
        const brandReviews = Array.from(this.reviews.values()).filter(r => r.brandId === brand.id);
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;
        const category = this.categories.get(brand.categoryId);
        
        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: category?.name,
        };
      });
  }

  async searchBrands(query: string): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.brands.values())
      .filter((brand) =>
        brand.status === 'approved' && // Only show approved brands
        (brand.name.toLowerCase().includes(lowercaseQuery) ||
        brand.instagramHandle.toLowerCase().includes(lowercaseQuery))
      )
      .map(brand => {
        const brandReviews = Array.from(this.reviews.values()).filter(r => r.brandId === brand.id);
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;
        const category = this.categories.get(brand.categoryId);
        
        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: category?.name,
        };
      });
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const id = this.currentIds.brands++;
    const now = new Date();
    const brand = { 
      ...insertBrand, 
      id, 
      createdAt: now,
      description: insertBrand.description ?? null,
      logoUrl: insertBrand.logoUrl ?? null,
      websiteUrl: insertBrand.websiteUrl ?? null,
      status: "pending" // Default status for new brands
    };
    this.brands.set(id, brand);
    return brand;
  }

  async updateBrandStatus(id: number, statusUpdate: UpdateBrandStatus): Promise<Brand | undefined> {
    const brand = this.brands.get(id);
    if (!brand) return undefined;
    
    const updatedBrand = { ...brand, status: statusUpdate.status };
    this.brands.set(id, updatedBrand);
    return updatedBrand;
  }

  async getPendingBrands(): Promise<(Brand & { categoryName?: string })[]> {
    return Array.from(this.brands.values())
      .filter(brand => brand.status === 'pending')
      .map(brand => {
        const category = this.categories.get(brand.categoryId);
        return {
          ...brand,
          categoryName: category?.name,
        };
      });
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByBrand(brandId: number): Promise<ReviewWithUser[]> {
    const brandReviews = Array.from(this.reviews.values()).filter(
      (review) => review.brandId === brandId,
    );
    return brandReviews.map(review => {
      const user = this.users.get(review.userId);
      return {
        ...review,
        userInstagramHandle: user?.instagramHandle || ''
      };
    });
  }

  async getUserReviewForBrand(
    userId: number,
    brandId: number,
  ): Promise<Review | undefined> {
    return Array.from(this.reviews.values()).find(
      (review) => review.userId === userId && review.brandId === brandId,
    );
  }

  async createReview(
    review: InsertReview & { userId: number },
  ): Promise<Review> {
    const id = this.currentIds.reviews++;
    const now = new Date();
    const newReview = { 
      ...review, 
      id, 
      createdAt: now,
      imageUrl: review.imageUrl ?? null
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentIds.categories++;
    const now = new Date();
    const category = { ...insertCategory, id, createdAt: now };
    this.categories.set(id, category);
    return category;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.currentIds.contactMessages++;
    const now = new Date();
    const message = { ...insertMessage, id, createdAt: now };
    this.contactMessages.set(id, message);
    return message;
  }

  async createAdminUser(): Promise<void> {
    // Create admin user if it doesn't exist
    const adminExists = await this.getUserByUsername("admin");
    if (!adminExists) {
      // Import hash function to properly hash the password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword("admin@3251");
      
      await this.createUser({
        username: "admin",
        password: hashedPassword,
        instagramHandle: "Instagram",
        isAdmin: true
      });
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PgSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand;
  }

  async getBrandByInstagramHandle(handle: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.instagramHandle, handle));
    return brand;
  }

  async getBrands(): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        instagramHandle: brands.instagramHandle,
        categoryId: brands.categoryId,
        description: brands.description,
        logoUrl: brands.logoUrl,
        websiteUrl: brands.websiteUrl,
        status: brands.status,
        createdAt: brands.createdAt,
        categoryName: categories.name,
      })
      .from(brands)
      .leftJoin(categories, eq(brands.categoryId, categories.id))
      .where(eq(brands.status, 'approved')); // Only approved brands

    // Get review stats for each brand
    const brandsWithStats = await Promise.all(
      result.map(async (brand) => {
        const brandReviews = await db.select().from(reviews).where(eq(reviews.brandId, brand.id));
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;

        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: brand.categoryName ?? undefined,
        };
      })
    );

    return brandsWithStats;
  }

  async getBrandsByCategory(categoryId: number): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        instagramHandle: brands.instagramHandle,
        categoryId: brands.categoryId,
        description: brands.description,
        logoUrl: brands.logoUrl,
        websiteUrl: brands.websiteUrl,
        status: brands.status,
        createdAt: brands.createdAt,
        categoryName: categories.name,
      })
      .from(brands)
      .leftJoin(categories, eq(brands.categoryId, categories.id))
      .where(and(eq(brands.categoryId, categoryId), eq(brands.status, 'approved'))); // Only approved brands

    // Get review stats for each brand
    const brandsWithStats = await Promise.all(
      result.map(async (brand) => {
        const brandReviews = await db.select().from(reviews).where(eq(reviews.brandId, brand.id));
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;

        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: brand.categoryName ?? undefined,
        };
      })
    );

    return brandsWithStats;
  }

  async searchBrands(query: string): Promise<(Brand & { averageRating?: number; reviewCount?: number; categoryName?: string })[]> {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        instagramHandle: brands.instagramHandle,
        categoryId: brands.categoryId,
        description: brands.description,
        logoUrl: brands.logoUrl,
        websiteUrl: brands.websiteUrl,
        status: brands.status,
        createdAt: brands.createdAt,
        categoryName: categories.name,
      })
      .from(brands)
      .leftJoin(categories, eq(brands.categoryId, categories.id))
      .where(
        and(
          eq(brands.status, 'approved'), // Only approved brands
          or(
            ilike(brands.name, `%${query}%`),
            ilike(brands.instagramHandle, `%${query}%`)
          )
        )
      );

    // Get review stats for each brand
    const brandsWithStats = await Promise.all(
      result.map(async (brand) => {
        const brandReviews = await db.select().from(reviews).where(eq(reviews.brandId, brand.id));
        const reviewCount = brandReviews.length;
        const averageRating = reviewCount > 0 
          ? brandReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
          : 0;

        return {
          ...brand,
          averageRating,
          reviewCount,
          categoryName: brand.categoryName ?? undefined,
        };
      })
    );

    return brandsWithStats;
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const [brand] = await db.insert(brands).values({ ...insertBrand, status: 'pending' }).returning();
    return brand;
  }

  async updateBrandStatus(id: number, statusUpdate: UpdateBrandStatus): Promise<Brand | undefined> {
    const [brand] = await db.update(brands)
      .set({ status: statusUpdate.status })
      .where(eq(brands.id, id))
      .returning();
    return brand;
  }

  async getPendingBrands(): Promise<(Brand & { categoryName?: string })[]> {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        instagramHandle: brands.instagramHandle,
        categoryId: brands.categoryId,
        description: brands.description,
        logoUrl: brands.logoUrl,
        websiteUrl: brands.websiteUrl,
        status: brands.status,
        createdAt: brands.createdAt,
        categoryName: categories.name,
      })
      .from(brands)
      .leftJoin(categories, eq(brands.categoryId, categories.id))
      .where(eq(brands.status, 'pending'));

    return result;
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async getReviewsByBrand(brandId: number): Promise<ReviewWithUser[]> {
    const result = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        brandId: reviews.brandId,
        rating: reviews.rating,
        reviewText: reviews.reviewText,
        imageUrl: reviews.imageUrl,
        createdAt: reviews.createdAt,
        userInstagramHandle: users.instagramHandle,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.brandId, brandId));
    
    return result;
  }

  async getUserReviewForBrand(userId: number, brandId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.brandId, brandId)
      )
    );
    return review;
  }

  async createReview(review: InsertReview & { userId: number }): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async getCategories(): Promise<Category[]> {
    return db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(insertMessage).returning();
    return message;
  }

  async createAdminUser(): Promise<void> {
    // Create admin user if it doesn't exist
    const adminExists = await this.getUserByUsername("admin");
    if (!adminExists) {
      // Import hash function to properly hash the password
      const { hashPassword } = await import("./auth");
      const hashedPassword = await hashPassword("admin@3251");
      
      await this.createUser({
        username: "admin",
        password: hashedPassword,
        instagramHandle: "Instagram",
        isAdmin: true
      });
    }
  }

  // Helper method to create initial default categories
  async createDefaultCategories(): Promise<void> {
    const defaultCategories = [
      "Gymwear",
      "Home Appliances",
      "Accessories",
      "Beauty Products",
      "Fashion",
      "Food & Beverages",
      "Tech Gadgets",
      "Art & Crafts",
    ];

    // Check if categories already exist
    const existingCategories = await this.getCategories();
    if (existingCategories.length === 0) {
      // Create categories in parallel
      await Promise.all(
        defaultCategories.map(name => this.createCategory({ name }))
      );
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();

// Initialize default categories and admin user
(async () => {
  try {
    await storage.createDefaultCategories();
    console.log("Default categories created or verified");
    await storage.createAdminUser();
    console.log("Admin user created or verified");
  } catch (error) {
    console.error("Error during initialization:", error);
  }
})();
