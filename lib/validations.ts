import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "F.I.Sh kamida 3 ta belgidan iborat bo'lishi kerak"),
  phone: z
    .string()
    .regex(/^\+?998\d{9}$/, "Telefon raqam formati noto'g'ri (+998xxxxxxxxx)"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  branchId: z.string().min(1, "Filialni tanlang"),
  positionId: z.string().min(1, "Lavozimni tanlang"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const userStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  role: z.enum(["admin", "employee"]).optional(),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});

export const guideSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().optional(),
  fileUrl: z.string().min(1, "PDF manbali yoki fayl URL kiritilishi shart"),
  fileSize: z.number().optional(),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});

export const videoSchema = z.object({
  title: z.string().min(2, "Sarlavha kamida 2 ta belgidan iborat bo'lishi kerak"),
  description: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL kiritilishi shart"),
  thumbnail: z.string().optional().or(z.literal("")),
  duration: z.number().optional(),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
});

export const optionSchema = z.object({
  text: z.string().min(1, "Variant matni bo'sh bo'lmasligi kerak"),
  isCorrect: z.boolean(),
});

export const questionSchema = z.object({
  text: z.string().min(1, "Savol matni bo'sh bo'lmasligi kerak"),
  order: z.number().default(0),
  options: z.array(optionSchema).min(2, "Kamida 2 ta variant kerak"),
});

export const quizSchema = z.object({
  title: z.string().min(2, "Sarlavha kiritilishi shart"),
  description: z.string().optional(),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  passScore: z.number().min(0).max(100).default(60),
  questions: z.array(questionSchema).min(1, "Kamida 1 ta savol kerak"),
});

export const quizSubmitSchema = z.object({
  answers: z.record(z.string(), z.string()), // { questionId: optionId }
});

export const checklistSchema = z.object({
  title: z.string().min(2, "Sarlavha kiritilishi shart"),
  frequency: z.enum(["DAILY", "WEEKLY"]),
  scope: z.enum(["GLOBAL", "BRANCH", "POSITION"]),
  branchId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  tasks: z.array(z.object({ label: z.string().min(1), order: z.number().default(0) })).min(1),
});

export const checklistSubmitSchema = z.object({
  periodDate: z.string(), // ISO date
  items: z.array(z.object({ taskId: z.string(), done: z.boolean() })),
  note: z.string().optional(),
});
