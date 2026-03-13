import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { teachersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { TeacherSignUpBody, TeacherSignInBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/hash.js";
import crypto from "crypto";

const router: IRouter = Router();

router.post("/signup", async (req, res) => {
  const parsed = TeacherSignUpBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { username, password, fullName } = parsed.data;
  const [existing] = await db.select().from(teachersTable).where(eq(teachersTable.username, username));
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const passwordHash = hashPassword(password);
  await db.insert(teachersTable).values({ username, passwordHash, fullName });
  const token = crypto.randomBytes(32).toString("hex");
  return res.status(201).json({ token, username, fullName });
});

router.post("/signin", async (req, res) => {
  const parsed = TeacherSignInBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { username, password } = parsed.data;
  const [teacher] = await db.select().from(teachersTable).where(eq(teachersTable.username, username));
  if (!teacher || !verifyPassword(password, teacher.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  return res.json({ token, username: teacher.username, fullName: teacher.fullName });
});

export default router;
