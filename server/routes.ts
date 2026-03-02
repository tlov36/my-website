import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Configure session and passport for local auth
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "local-secret-for-dev",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        // Simple string comparison as per requirements (not using bcrypt for minimal setup unless requested)
        if (!user || user.password !== password) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not logged in" });
    }
    res.json(req.user);
  });

  // Projects Routes
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  });

  app.post(api.projects.create.path, requireAuth, async (req, res) => {
    try {
      const data = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(data);
      res.status(201).json(project);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message, field: e.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.put(api.projects.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), data);
      if (!project) return res.status(404).json({ message: "Not found" });
      res.json(project);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message, field: e.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(api.projects.delete.path, requireAuth, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).send();
  });

  // Content Routes
  app.get(api.content.list.path, async (req, res) => {
    const content = await storage.getAllContent();
    res.json(content);
  });

  app.put(api.content.update.path, requireAuth, async (req, res) => {
    try {
      const data = api.content.update.input.parse(req.body);
      const content = await storage.upsertContent(req.params.key, data.content);
      res.json(content);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: e.errors[0].message, field: e.errors[0].path.join(".") });
      }
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Seed default user and content
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const admin = await storage.getUserByUsername("admin");
  if (!admin) {
    await storage.createUser({
      username: "admin",
      password: "password123", // Simple default password for dev
    });
  }

  const defaultContent = [
    { key: "architektur", content: "Wir gestalten Räume, die nicht nur funktionieren, sondern auch inspirieren. Unser Fokus liegt auf klarer Linienführung und der ehrlichen Nutzung von Materialien." },
    { key: "design", content: "Gutes Design ist unsichtbar. Wir reduzieren Komplexität, um das Wesentliche sichtbar zu machen und schaffen Objekte von zeitloser Eleganz." },
    { key: "philosophie", content: "Unsere Arbeit basiert auf Transparenz, Kooperation und dem Streben nach Wahrheit in der Form. Wir glauben an nachhaltige und durchdachte Lösungen." },
    { key: "gestalten_und_beraten", content: "Von der ersten Skizze bis zur finalen Umsetzung stehen wir beratend zur Seite. Ein partnerschaftlicher Ansatz ist für uns der Schlüssel zu herausragenden Ergebnissen." },
  ];

  for (const item of defaultContent) {
    const existing = await storage.getContent(item.key);
    if (!existing) {
      await storage.upsertContent(item.key, item.content);
    }
  }

  const existingProjects = await storage.getProjects();
  if (existingProjects.length === 0) {
    await storage.createProject({
      title: "Haus am See",
      description: "Ein minimalistischer Rückzugsort mit klaren Sichtachsen und offenen Wohnräumen.",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    });
    await storage.createProject({
      title: "Atelierausbau Berlin",
      description: "Transformation eines alten Lofts in einen modernen, lichtdurchfluteten Arbeitsbereich.",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
    });
    await storage.createProject({
      title: "Pavillon 01",
      description: "Ein Ausstellungspavillon, der das Zusammenspiel von Natur und Architektur betont.",
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
    });
  }
}
