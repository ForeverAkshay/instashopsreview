
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertBrandSchema, insertReviewSchema, insertContactMessageSchema, insertUserSchema, updateBrandStatusSchema, contactMessages } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the improved validation schema from shared
const contactMessageSchema = insertContactMessageSchema;

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Configure multer for logo uploads
  const uploadsDir = path.join(__dirname, '..', 'client', 'dist', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage_multer,
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
      } else {
        cb(new Error('Only JPG and JPEG files are allowed'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  // Brands
  app.get("/api/brands", async (req, res) => {
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string)
      : undefined;
    const query = req.query.q as string | undefined;

    let brands;
    if (categoryId) {
      brands = await storage.getBrandsByCategory(categoryId);
    } else if (query) {
      brands = await storage.searchBrands(query);
    } else {
      brands = await storage.getBrands();
    }

    res.json(brands);
  });

  // Get individual brand with stats
  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      if (isNaN(brandId)) {
        return res.status(400).json({ error: "Invalid brand ID" });
      }

      const brand = await storage.getBrand(brandId);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }

      // Get brand with stats
      const brands = await storage.getBrands();
      const brandWithStats = brands.find(b => b.id === brandId);
      
      res.json(brandWithStats || brand);
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({ error: "Failed to fetch brand" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = insertBrandSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const existingBrand = await storage.getBrandByInstagramHandle(
      parseResult.data.instagramHandle,
    );
    if (existingBrand) {
      return res.status(400).send("Brand with this Instagram handle already exists");
    }

    const brand = await storage.createBrand(parseResult.data);
    res.status(201).json(brand);
  });

  // Reviews
  app.get("/api/brands/:brandId/reviews", async (req, res) => {
    const reviews = await storage.getReviewsByBrand(parseInt(req.params.brandId));
    res.json(reviews);
  });

  app.post("/api/brands/:brandId/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parseResult = insertReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    const existingReview = await storage.getUserReviewForBrand(
      req.user!.id,
      parseInt(req.params.brandId),
    );
    if (existingReview) {
      return res.status(400).send("You have already reviewed this brand");
    }

    const review = await storage.createReview({
      ...parseResult.data,
      userId: req.user!.id,
      brandId: parseInt(req.params.brandId),
    });
    res.status(201).json(review);
  });

  // Logo Upload
  app.post("/api/upload/logo", upload.single('logo'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }

    const logoUrl = '/uploads/' + req.file.filename;
    res.json({ logoUrl });
  });

  // Contact Messages
  app.post("/api/contact", async (req, res) => {
    const parseResult = contactMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }
    
    // Use the db import directly instead of trying to access it through storage
    const message = await storage.createContactMessage(parseResult.data);
    res.status(201).json(message);
  });

  // Admin route to view contact messages (only for admin users)
  app.get("/api/admin/contact-messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Check if user is admin
    const user = await storage.getUser(req.user!.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  // Admin routes for brand approval
  // Middleware to check if user is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  // Get pending brands for admin approval
  app.get("/api/admin/brands/pending", requireAdmin, async (req, res) => {
    try {
      const pendingBrands = await storage.getPendingBrands();
      res.json(pendingBrands);
    } catch (error) {
      console.error("Error fetching pending brands:", error);
      res.status(500).json({ error: "Failed to fetch pending brands" });
    }
  });

  // Update brand status (approve/reject)  
  app.patch("/api/admin/brands/:id/status", requireAdmin, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const statusData = updateBrandStatusSchema.parse(req.body);
      
      const updatedBrand = await storage.updateBrandStatus(brandId, statusData);
      if (!updatedBrand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      
      res.json(updatedBrand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      console.error("Error updating brand status:", error);
      res.status(500).json({ error: "Failed to update brand status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
