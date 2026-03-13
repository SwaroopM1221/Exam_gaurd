import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { examsTable, studentsTable, examSessionsTable, violationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { AuditorSignInBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

const AUDITOR_USERNAME = "admin";
const AUDITOR_PASSWORD = "admin123";
const tokens = new Set<string>();

router.post("/signin", (req, res) => {
  const parsed = AuditorSignInBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { username, password } = parsed.data;
  if (username !== AUDITOR_USERNAME || password !== AUDITOR_PASSWORD) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  tokens.add(token);
  return res.json({ token, username });
});

router.get("/sessions", async (req, res) => {
  const examIdParam = req.query.examId;
  const examId = examIdParam ? parseInt(examIdParam as string) : undefined;

  const sessions = await db
    .select({
      sessionId: examSessionsTable.id,
      studentId: studentsTable.id,
      usn: studentsTable.usn,
      studentName: studentsTable.studentName,
      examId: examsTable.id,
      examTitle: examsTable.title,
      joinCode: examsTable.joinCode,
      status: examSessionsTable.status,
      joinedAt: examSessionsTable.joinedAt,
    })
    .from(examSessionsTable)
    .innerJoin(studentsTable, eq(examSessionsTable.studentId, studentsTable.id))
    .innerJoin(examsTable, eq(examSessionsTable.examId, examsTable.id))
    .where(examId ? eq(examSessionsTable.examId, examId) : undefined);

  const enriched = await Promise.all(
    sessions.map(async (s) => {
      const violations = await db
        .select()
        .from(violationsTable)
        .where(eq(violationsTable.studentId, s.studentId));

      const tabSwitches = violations.filter(v => v.type === "TAB_SWITCH").length;
      const windowResizes = violations.filter(v => v.type === "WINDOW_RESIZE").length;
      const keyboardAttempts = violations.filter(v => v.type === "KEYBOARD_ATTEMPT").length;
      const idleDetections = violations.filter(v => v.type === "IDLE_DETECTED").length;

      let trustScore = 100;
      trustScore -= tabSwitches * 10;
      trustScore -= windowResizes * 5;
      trustScore -= keyboardAttempts * 15;
      trustScore -= idleDetections * 5;
      trustScore = Math.max(0, trustScore);

      return {
        ...s,
        joinedAt: s.joinedAt.toISOString(),
        trustScore,
        violationCount: violations.length,
      };
    })
  );

  return res.json({ sessions: enriched });
});

router.get("/exams", async (_req, res) => {
  const exams = await db.select().from(examsTable);

  const enriched = await Promise.all(
    exams.map(async (exam) => {
      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(examSessionsTable)
        .where(eq(examSessionsTable.examId, exam.id));

      return {
        id: exam.id,
        title: exam.title,
        teacherName: exam.teacherName,
        joinCode: exam.joinCode,
        duration: exam.duration,
        studentCount: result?.count ?? 0,
        createdAt: exam.createdAt.toISOString(),
      };
    })
  );

  return res.json({ exams: enriched });
});

export default router;
