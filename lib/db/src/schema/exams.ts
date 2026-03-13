import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  teacherName: text("teacher_name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  duration: integer("duration").notNull(),
  questions: jsonb("questions").notNull().$type<Question[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Question = {
  text: string;
  type: "multiple_choice" | "short_answer" | "true_false";
  options?: string[];
  correctAnswer?: string;
};

export const insertExamSchema = createInsertSchema(examsTable).omit({ id: true, createdAt: true });
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof examsTable.$inferSelect;
