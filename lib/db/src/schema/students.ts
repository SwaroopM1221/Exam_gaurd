import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { examsTable } from "./exams";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  usn: text("usn").notNull(),
  studentName: text("student_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const examSessionsTable = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  examId: integer("exam_id").notNull().references(() => examsTable.id),
  status: text("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;

export const insertExamSessionSchema = createInsertSchema(examSessionsTable).omit({ id: true, joinedAt: true });
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type ExamSession = typeof examSessionsTable.$inferSelect;
