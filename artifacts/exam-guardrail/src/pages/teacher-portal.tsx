import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { useCreateExam, useTeacherSignIn, useTeacherSignUp, customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Trash2, Copy, CheckCircle2, LogIn, UserPlus, LogOut, GraduationCap, LayoutDashboard, FilePlus, Users, ChevronRight, Clock, FileUp, Sparkles, AlertCircle, Loader2, BookOpen } from "lucide-react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["multiple_choice", "short_answer", "true_false"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  marks: z.coerce.number().min(1, "Marks must be at least 1"),
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
    <Layout>
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950/50 p-4 min-h-screen">
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
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signin" ? "bg-white dark:bg-slate-800 shadow text-foreground" : "text-muted-foreground"}`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />Sign In
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "signup" ? "bg-white dark:bg-slate-800 shadow text-foreground" : "text-muted-foreground"}`}
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
  const [view, setView] = useState<"create" | "dashboard">("dashboard");
  const [createdExamCode, setCreatedExamCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questionTypes, setQuestionTypes] = useState<string[]>(["multiple_choice", "short_answer"]);
  const [generationType, setGenerationType] = useState<"manual" | "ai">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createExamMutation = useCreateExam();

  const { register, control, handleSubmit, watch, formState: { errors }, reset } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      teacherName: fullName ?? "",
      questions: [{ text: "", type: "multiple_choice", options: ["", "", "", ""], correctAnswer: "", marks: 5 }]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: "questions" });

  if (!isAuthenticated) {
    return <TeacherAuthGate login={login} />;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setUploadedFile(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const generateAIQuestions = async () => {
    if (!uploadedFile) return;
    
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("difficulty", difficulty);
      formData.append("questionTypes", JSON.stringify(questionTypes));
      
      const response = await fetch("/api/teacher/generate-questions", {
        method: "POST",
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Generation failed");
      }
      
      if (responseData.questions && Array.isArray(responseData.questions)) {
        replace(responseData.questions);
        setGenerationType("manual");
        setUploadedFile(null);
      }
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      alert(err.message || "Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: ExamFormValues) => {
    const cleanedQuestions = data.questions.map(q => {
      const questionData = { 
        text: q.text, 
        type: q.type, 
        correctAnswer: q.correctAnswer, 
        marks: Number(q.marks) || 0 
      };
      if (q.type === "multiple_choice") {
        return { ...questionData, options: q.options };
      }
      return questionData;
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
            <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 mb-8 relative group">
              <div className="text-5xl font-mono font-bold tracking-widest text-primary">{createdExamCode}</div>
              <button
                onClick={copyCode}
                className="absolute top-4 right-4 p-2 bg-secondary rounded-lg text-secondary-foreground hover:bg-secondary/80 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => { setCreatedExamCode(null); setView("dashboard"); reset(); }} variant="outline" className="flex-1">Go to Dashboard</Button>
              <Button onClick={() => { setCreatedExamCode(null); setView("create"); reset(); }} className="flex-1">Create Another</Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Teacher Portal">
      <div className="flex-1 flex flex-col">
        <div className="bg-card border-b sticky top-16 z-40 transition-colors">
          <div className="max-w-7xl mx-auto px-4 flex">
            <button
              onClick={() => setView("dashboard")}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium ${view === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              My Exams
            </button>
            <button
              onClick={() => setView("create")}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium ${view === "create" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <FilePlus className="w-4 h-4" />
              Create Exam
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full p-8">
          <AnimatePresence mode="wait">
            {view === "dashboard" ? (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <TeacherDashboard fullName={fullName!} />
              </motion.div>
            ) : (
              <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="max-w-4xl mx-auto">
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Exam Creator</span>
                      </div>
                      <h1 className="text-3xl font-bold text-foreground">Design Question Paper</h1>
                      <p className="text-muted-foreground mt-2">Create an exam manually or generate using AI from PDF.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex bg-secondary rounded-xl p-1 mr-4">
                        <button
                          type="button"
                          onClick={() => setGenerationType("manual")}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${generationType === "manual" ? "bg-white dark:bg-slate-800 shadow text-foreground" : "text-muted-foreground"}`}
                        >
                          Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setGenerationType("ai")}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${generationType === "ai" ? "bg-white dark:bg-slate-800 shadow text-primary flex items-center gap-2" : "text-muted-foreground flex items-center gap-2"}`}
                        >
                          <Sparkles className="w-4 h-4" /> AI Generate
                        </button>
                      </div>
                      <span className="text-sm text-muted-foreground">Signed in as <span className="font-semibold text-foreground">{fullName}</span></span>
                      <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive">
                        <LogOut className="w-4 h-4 mr-1" /> Sign Out
                      </Button>
                    </div>
                  </div>

                  {generationType === "ai" ? (
                    <Card className="p-12 text-center border-dashed border-2 border-primary/20 bg-primary/5">
                      <div className="max-w-md mx-auto space-y-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
                          <FileUp className="w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">Upload Reference PDF</h3>
                          <p className="text-muted-foreground">AI will analyze your document to generate relevant questions.</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {(["easy", "medium", "hard"] as const).map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setDifficulty(level)}
                              className={`py-3 rounded-xl text-sm font-bold capitalize border-2 transition-all ${difficulty === level ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-card border-border hover:border-primary/50"}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3 text-left">
                          <Label className="text-sm font-bold ml-1">Question Types</Label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: "multiple_choice", label: "MCQs" },
                              { id: "true_false", label: "True/False" },
                              { id: "short_answer", label: "Short Answer" }
                            ].map((type) => (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                  setQuestionTypes(prev => 
                                    prev.includes(type.id) 
                                      ? prev.filter(t => t !== type.id) 
                                      : [...prev, type.id]
                                  );
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${questionTypes.includes(type.id) ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}
                              >
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={`p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadedFile ? 'bg-success/5 border-success/30' : 'hover:border-primary/50 bg-card'}`}
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileUpload} 
                            accept=".pdf" 
                            className="hidden" 
                          />
                          {uploadedFile ? (
                            <div className="flex items-center justify-center gap-3 text-success">
                              <CheckCircle2 className="w-6 h-6" />
                              <span className="font-semibold truncate max-w-[200px]">{uploadedFile.name}</span>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">
                              <p className="font-semibold">Click to select PDF</p>
                              <p className="text-xs mt-1">Maximum size 10MB</p>
                            </div>
                          )}
                        </div>

                        <Button 
                          onClick={generateAIQuestions} 
                          disabled={!uploadedFile || isGenerating}
                          className="w-full py-6 text-lg gap-3"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Analyzing Document...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate Question Paper
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground bg-white/50 dark:bg-slate-950/50 p-3 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          Generated questions can be edited before final submission.
                        </div>
                      </div>
                    </Card>
                  ) : (
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
                          <Button type="button" variant="secondary" onClick={() => append({ text: "", type: "multiple_choice", options: ["", "", "", ""], correctAnswer: "", marks: 5 })}>
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
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                                      <div className="col-span-1">
                                        <Label required>Marks</Label>
                                        <Input 
                                          type="number" 
                                          placeholder="5" 
                                          {...register(`questions.${index}.marks` as const)} 
                                          error={errors?.questions?.[index]?.marks?.message} 
                                        />
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
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

// --- DASHBOARD COMPONENTS ---

function TeacherDashboard({ fullName }: { fullName: string }) {
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ['teacher-exams', fullName],
    queryFn: () => customFetch<{ exams: any[] }>(`/api/teacher/exams?teacherName=${encodeURIComponent(fullName)}`),
    refetchInterval: 10000
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['exam-sessions', selectedExamId],
    queryFn: () => customFetch<{ sessions: any[] }>(`/api/teacher/exams/${selectedExamId}/sessions`),
    enabled: !!selectedExamId,
    refetchInterval: 5000
  });

  const exams = examsData?.exams || [];
  const sessions = sessionsData?.sessions || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Exams List */}
      <div className="lg:col-span-4 space-y-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Active & Past Exams
        </h3>
        {loadingExams ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
          </div>
        ) : exams.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">No exams created yet.</p>
          </Card>
        ) : (
          exams.map(exam => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              className={`w-full text-left p-5 rounded-2xl transition-all border-2 ${selectedExamId === exam.id ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-transparent bg-card hover:border-border shadow-sm"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold truncate">{exam.title}</h4>
                <Badge variant="outline" className="font-mono text-[10px]">{exam.joinCode}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {exam.studentCount} Joined</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration}m</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Student Results */}
      <div className="lg:col-span-8 space-y-4">
        <h3 className="font-bold text-lg mb-4">Student Results & Monitoring</h3>
        {!selectedExamId ? (
          <Card className="h-[400px] flex flex-col items-center justify-center text-center p-12 border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ChevronRight className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-xl font-semibold mb-2">Select an exam to view results</h4>
            <p className="text-muted-foreground">Choose an exam from the left sidebar to see student performance and behavior scores.</p>
          </Card>
        ) : loadingSessions ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">No students have joined this exam yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Student</div>
              <div className="col-span-2">Joined At</div>
              <div className="col-span-2 text-center">Score</div>
              <div className="col-span-2 text-center">Trust Score</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            {sessions.map(s => (
              <div key={s.sessionId} className="space-y-2">
                <Card 
                  className={`p-4 hover:shadow-md transition-all cursor-pointer border-2 ${expandedSessionId === s.sessionId ? 'border-primary/30 shadow-md' : 'border-transparent'}`}
                  onClick={() => setExpandedSessionId(expandedSessionId === s.sessionId ? null : s.sessionId)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm">{s.studentName}</div>
                        {expandedSessionId === s.sessionId ? <ChevronRight className="w-4 h-4 rotate-90 transition-transform" /> : <ChevronRight className="w-4 h-4 transition-transform" />}
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground">{s.usn}</div>
                    </div>
                    <div className="col-span-2 text-xs text-muted-foreground">
                      {new Date(s.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="font-bold text-primary">{s.score ?? 0}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">
                        / {s.examQuestions?.reduce((acc: number, q: any) => acc + (q.marks || 0), 0) || 100}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${s.trustScore > 70 ? 'bg-success' : s.trustScore > 40 ? 'bg-warning' : 'bg-destructive'}`}
                            style={{ width: `${s.trustScore}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-bold ${s.trustScore > 70 ? 'text-success' : s.trustScore > 40 ? 'text-warning' : 'text-destructive'}`}>
                          {s.trustScore}%
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={s.status === 'active' ? 'primary' : 'outline'} className="text-[10px] capitalize">
                        {s.status}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Expanded Answers View */}
                <AnimatePresence>
                  {expandedSessionId === s.sessionId && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <Card className="mx-4 p-6 bg-muted/30 border-t-0 rounded-t-none rounded-b-2xl border-x-primary/10 border-b-primary/10">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Student Responses</h5>
                        <div className="space-y-4">
                          {s.examQuestions?.map((q: any, idx: number) => {
                            const isCorrect = (s.answers[idx] || "").trim().toLowerCase() === (q.correctAnswer || "").trim().toLowerCase();
                            return (
                              <div key={idx} className="space-y-2">
                                <div className="text-sm font-semibold flex gap-2">
                                  <span className="text-muted-foreground">{idx + 1}.</span>
                                  <span>{q.text}</span>
                                  <Badge variant="outline" className="ml-auto text-[10px]">{q.marks} marks</Badge>
                                </div>
                                <div className={`text-sm p-3 rounded-xl border ${isCorrect ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Student's Answer:</span>
                                      <span className={`font-medium ${isCorrect ? 'text-success' : 'text-destructive'}`}>
                                        {s.answers[idx] || <em className="text-muted-foreground/50">No answer provided</em>}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Correct Answer:</span>
                                      <span className="font-medium text-success">{q.correctAnswer}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
