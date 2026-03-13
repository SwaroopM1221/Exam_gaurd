import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label } from "@/components/ui";
import { useCreateExam, useTeacherSignIn, useTeacherSignUp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, Copy, CheckCircle2, LogIn, UserPlus, LogOut, GraduationCap } from "lucide-react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["multiple_choice", "short_answer", "true_false"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
});

const examSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  teacherName: z.string().min(2, "Teacher name is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
});

type ExamFormValues = z.infer<typeof examSchema>;

function TeacherAuthGate({ login }: { login: (token: string, username: string, fullName?: string) => void }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const signInMutation = useTeacherSignIn();
  const signUpMutation = useTeacherSignUp();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    signInMutation.mutate({ data: { username, password } }, {
      onSuccess: (res) => {
        login(res.token, res.username, res.fullName);
      },
      onError: () => setError("Invalid username or password"),
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required"); return; }
    signUpMutation.mutate({ data: { username, password, fullName } }, {
      onSuccess: (res) => {
        login(res.token, res.username, res.fullName);
      },
      onError: (err: any) => {
        const msg = err?.data?.error ?? "Registration failed";
        setError(msg);
      },
    });
  };

  return (
    <Layout showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 min-h-screen">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Teacher Portal</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in or create an account to manage exams</p>
          </div>

          <div className="flex bg-secondary rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab("signin"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signin" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />Sign In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signup" ? "bg-white shadow text-foreground" : "text-muted-foreground"}`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "signin" ? (
              <motion.form key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label>Username</Label>
                  <Input placeholder="e.g. prof_smith" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                <Button type="submit" className="w-full" isLoading={signInMutation.isPending}>Sign In</Button>
                <p className="text-center text-sm text-muted-foreground">
                  No account yet?{" "}
                  <button type="button" onClick={() => setTab("signup")} className="text-primary font-semibold hover:underline">Register here</button>
                </p>
              </motion.form>
            ) : (
              <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Prof. John Smith" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                <Button type="submit" className="w-full" isLoading={signUpMutation.isPending}>Create Account</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setTab("signin")} className="text-primary font-semibold hover:underline">Sign in</button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </Layout>
  );
}

export default function TeacherPortal() {
  const { isAuthenticated, fullName, logout, login } = useAuth("teacher");
  const [createdExamCode, setCreatedExamCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createExamMutation = useCreateExam();

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      teacherName: fullName ?? "",
      questions: [{ text: "", type: "multiple_choice", options: ["", "", "", ""], correctAnswer: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "questions" });

  if (!isAuthenticated) {
    return <TeacherAuthGate login={login} />;
  }

  const onSubmit = (data: ExamFormValues) => {
    const cleanedQuestions = data.questions.map(q => {
      if (q.type !== "multiple_choice") {
        return { text: q.text, type: q.type, correctAnswer: q.correctAnswer };
      }
      return q as any;
    });
    createExamMutation.mutate({ data: { ...data, questions: cleanedQuestions } }, {
      onSuccess: (res) => {
        setCreatedExamCode(res.joinCode);
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
    });
  };

  const copyCode = () => {
    if (createdExamCode) {
      navigator.clipboard.writeText(createdExamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (createdExamCode) {
    return (
      <Layout backLink="/" title="Exam Created">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <Card className="text-center p-12 bg-gradient-to-b from-success/5 to-transparent border-success/20">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Exam Successfully Created!</h2>
            <p className="text-muted-foreground mb-8 text-lg">Share this join code with your students.</p>
            <div className="bg-white border-2 border-dashed border-border rounded-2xl p-8 mb-8 relative group">
              <div className="text-5xl font-mono font-bold tracking-widest text-primary">{createdExamCode}</div>
              <button
                onClick={copyCode}
                className="absolute top-4 right-4 p-2 bg-secondary rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <Button onClick={() => setCreatedExamCode(null)} variant="outline" size="lg">
              Create Another Exam
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backLink="/" title="Create Exam">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Design Question Paper</h1>
            <p className="text-muted-foreground mt-2">Create an exam and generate a secure joining code.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{fullName}</span></span>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <Card className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-4">General Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label required>Exam Title</Label>
                <Input placeholder="e.g. Midterm Computer Science" {...register("title")} error={errors.title?.message} />
              </div>
              <div>
                <Label required>Teacher Name</Label>
                <Input placeholder="Prof. Smith" {...register("teacherName")} error={errors.teacherName?.message} />
              </div>
              <div className="md:col-span-2">
                <Label>Description (Optional)</Label>
                <textarea
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px]"
                  placeholder="Instructions for students..."
                  {...register("description")}
                />
              </div>
              <div>
                <Label required>Duration (Minutes)</Label>
                <Input type="number" placeholder="60" {...register("duration")} error={errors.duration?.message} />
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">Questions</h3>
              <Button type="button" variant="secondary" onClick={() => append({ text: "", type: "multiple_choice", options: ["", "", "", ""], correctAnswer: "" })}>
                <Plus className="w-4 h-4 mr-2" /> Add Question
              </Button>
            </div>
            {errors.questions?.root && (
              <p className="text-destructive font-medium">{errors.questions.root.message}</p>
            )}
            <AnimatePresence>
              {fields.map((field, index) => {
                const qType = watch(`questions.${index}.type`);
                return (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Card className="relative pt-10">
                      <div className="absolute top-0 left-0 bg-primary/10 text-primary px-4 py-1.5 rounded-br-2xl rounded-tl-2xl font-bold text-sm">
                        Q{index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors p-2 bg-secondary rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="space-y-6">
                        <div>
                          <Label required>Question Text</Label>
                          <Input placeholder="What is..." {...register(`questions.${index}.text` as const)} error={errors?.questions?.[index]?.text?.message} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="col-span-1">
                            <Label>Question Type</Label>
                            <select
                              {...register(`questions.${index}.type` as const)}
                              className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            >
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="true_false">True / False</option>
                              <option value="short_answer">Short Answer</option>
                            </select>
                          </div>
                          <div className="col-span-2 space-y-4">
                            {qType === "multiple_choice" && (
                              <div className="space-y-3">
                                <Label>Options</Label>
                                {[0, 1, 2, 3].map((optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-muted-foreground w-6 text-right">{String.fromCharCode(65 + optIdx)}.</span>
                                    <Input placeholder={`Option ${optIdx + 1}`} {...register(`questions.${index}.options.${optIdx}` as const)} />
                                  </div>
                                ))}
                                <div className="mt-4 pt-4 border-t">
                                  <Label>Correct Answer</Label>
                                  <select
                                    {...register(`questions.${index}.correctAnswer` as const)}
                                    className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                                  >
                                    <option value="">Select correct option...</option>
                                    {[0, 1, 2, 3].map((optIdx) => (
                                      <option key={optIdx} value={watch(`questions.${index}.options.${optIdx}` as any)}>
                                        Option {String.fromCharCode(65 + optIdx)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                            {qType === "true_false" && (
                              <div>
                                <Label required>Correct Answer</Label>
                                <select
                                  {...register(`questions.${index}.correctAnswer` as const)}
                                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                                >
                                  <option value="">Select...</option>
                                  <option value="True">True</option>
                                  <option value="False">False</option>
                                </select>
                              </div>
                            )}
                            {qType === "short_answer" && (
                              <div>
                                <Label>Reference Answer (Optional)</Label>
                                <Input placeholder="Keywords..." {...register(`questions.${index}.correctAnswer` as const)} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl p-4 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex justify-end">
            <Button type="submit" size="lg" className="w-full md:w-auto px-12" isLoading={createExamMutation.isPending}>
              Generate Exam Paper
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
