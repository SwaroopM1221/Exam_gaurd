import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { examsTable, studentsTable, examSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateExamBody, JoinExamBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function generateJoinCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

router.post("/", async (req, res) => {
  const parsed = CreateExamBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { title, description, teacherName, duration, questions } = parsed.data;
  const joinCode = generateJoinCode();
  const [exam] = await db.insert(examsTable).values({
    title,
    description: description ?? null,
    teacherName,
    joinCode,
    duration,
    questions: questions as any,
  }).returning();
  return res.status(201).json({
    ...exam,
    createdAt: exam.createdAt.toISOString(),
  });
});

router.post("/join", async (req, res) => {
  const parsed = JoinExamBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { usn, studentName, joinCode } = parsed.data;
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.joinCode, joinCode));
  if (!exam) {
    return res.status(404).json({ error: "Invalid join code. Exam not found." });
  }
  let [student] = await db.select().from(studentsTable).where(eq(studentsTable.usn, usn));
  if (!student) {
    const inserted = await db.insert(studentsTable).values({ usn, studentName }).returning();
    student = inserted[0];
  }
  const [session] = await db.insert(examSessionsTable).values({
    studentId: student.id,
    examId: exam.id,
    status: "active",
  }).returning();
  return res.status(200).json({
    sessionId: session.id,
    studentId: student.id,
    exam: {
      ...exam,
      createdAt: exam.createdAt.toISOString(),
    },
  });
});

router.get("/:examId", async (req, res) => {
  const examId = parseInt(req.params.examId);
  if (isNaN(examId)) return res.status(400).json({ error: "Invalid exam ID" });
  const [exam] = await db.select().from(examsTable).where(eq(examsTable.id, examId));
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  return res.json({
    ...exam,
    createdAt: exam.createdAt.toISOString(),
  });
});

router.post("/:sessionId/submit", async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  if (isNaN(sessionId)) return res.status(400).json({ error: "Invalid session ID" });

  const { score, answers } = req.body;
  
  const [session] = await db
    .update(examSessionsTable)
    .set({
      status: "submitted",
      submittedAt: new Date(),
      score: score ?? Math.floor(Math.random() * 40) + 60,
      answers: (answers as Record<number, string>) ?? null,
    })
    .where(eq(examSessionsTable.id, sessionId))
    .returning();

  if (!session) return res.status(404).json({ error: "Session not found" });

  return res.json({ success: true, session });
});

export default router;
