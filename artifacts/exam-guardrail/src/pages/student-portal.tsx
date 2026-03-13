import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { useJoinExam, useGetTrustScore, customFetch } from "@workspace/api-client-react";
import { useExamMonitor } from "@/hooks/use-exam-monitor";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ShieldCheck, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

// --- JOIN FORM ---

const joinSchema = z.object({
  usn: z.string().min(3, "USN/ID is required"),
  studentName: z.string().min(2, "Name is required"),
  joinCode: z.string().min(5, "Valid join code required"),
});
type JoinFormValues = z.infer<typeof joinSchema>;

export default function StudentPortal() {
  const [session, setSession] = useState<{ sessionId: number, studentId: number, exam: any } | null>(null);
  const [examFinished, setExamFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [totalPossibleScore, setTotalPossibleScore] = useState<number | null>(null);

  const joinMutation = useJoinExam();

  const { register, handleSubmit, formState: { errors } } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema)
  });

  const onJoin = (data: JoinFormValues) => {
    joinMutation.mutate({ data }, {
      onSuccess: (res) => {
        setSession(res);
      },
      onError: (err: any) => {
        alert(err?.data?.error || "Failed to join exam. Check your join code and try again.");
      }
    });
  };

  if (examFinished) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="p-12 text-center max-w-lg mx-auto bg-card text-card-foreground">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Exam Completed</h2>
            
            {finalScore !== null && (
              <div className="mb-8 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Your Score</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black text-primary">{finalScore}</span>
                  <span className="text-xl font-bold text-muted-foreground">/ {totalPossibleScore || 100}</span>
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground mb-8">Your responses have been recorded successfully. The session is now closed.</p>
            <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
              Return Home
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout backLink="/" title="Student Portal">
        <div className="max-w-md mx-auto py-20 px-4">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Secure Exam Entry</h2>
              <p className="text-muted-foreground text-sm mt-2">
                This session is heavily monitored. Switching tabs, resizing windows, or forbidden keys will be flagged.
              </p>
            </div>

            <form onSubmit={handleSubmit(onJoin)} className="space-y-5">
              <div>
                <Label required>Join Code</Label>
                <Input 
                  placeholder="e.g. A7X9P" 
                  className="font-mono text-lg tracking-widest uppercase"
                  {...register("joinCode")} 
                  error={errors.joinCode?.message} 
                />
              </div>
              <div>
                <Label required>USN / Student ID</Label>
                <Input placeholder="e.g. 1RV20CS001" {...register("usn")} error={errors.usn?.message} />
              </div>
              <div>
                <Label required>Full Name</Label>
                <Input placeholder="John Doe" {...register("studentName")} error={errors.studentName?.message} />
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3 mt-6">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning-foreground font-medium">
                  By joining, you agree to continuous behavioral monitoring for academic integrity purposes.
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg" isLoading={joinMutation.isPending}>
                Join Exam Now
              </Button>
            </form>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNav={false}>
      <ActiveExamView session={session} onFinish={(score, total) => {
        setFinalScore(score);
        setTotalPossibleScore(total);
        setExamFinished(true);
      }} />
    </Layout>
  );
}

// --- ACTIVE EXAM VIEW ---

function ActiveExamView({ session, onFinish }: { session: any, onFinish: (score: number, total: number) => void }) {
  const { exam, sessionId, studentId } = session;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Activate monitoring hooks
  useExamMonitor(sessionId, studentId);

  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    // Calculate actual score based on correct answers and marks
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    exam.questions.forEach((q: any, i: number) => {
      const questionMarks = Number(q.marks) || 0;
      maxPossibleScore += questionMarks;
      
      const studentAnswer = (answers[i] || "").trim().toLowerCase();
      const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();

      if (studentAnswer === correctAnswer && studentAnswer !== "") {
        totalScore += questionMarks;
      }
    });

    try {
      await customFetch(`/api/exams/${sessionId}/submit`, {
        method: "POST",
        body: JSON.stringify({ 
          score: totalScore,
          answers 
        })
      });
      onFinish(totalScore, maxPossibleScore);
    } catch (err) {
      console.error("Failed to submit exam", err);
      onFinish(totalScore, maxPossibleScore); // Still finish even if API fails for now
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerChange = (questionIdx: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionIdx]: answer }));
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-background flex flex-col text-foreground">
      {/* Exam Header bar (replaces standard nav) */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">Proctored by {exam.teacherName}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            
            <Button onClick={handleSubmit} variant="primary" isLoading={isSubmitting}>Submit Exam</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-4">
        {/* Fullscreen warning overlay if they leave (handled by hook, but good to have visual too, omitted for brevity as API handles it) */}
        
        <div className="space-y-8">
          {exam.questions.map((q: any, i: number) => (
            <Card key={i} className="pt-8 relative">
              <div className="absolute top-0 left-0 bg-secondary px-4 py-1 rounded-br-xl rounded-tl-2xl font-bold text-sm text-secondary-foreground">
                Question {i + 1}
              </div>
              
              <h3 className="text-lg font-medium text-foreground mb-6">{q.text}</h3>
              
              {q.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label key={optIdx} className="flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input 
                        type="radio" 
                        name={`q_${i}`} 
                        className="w-4 h-4 text-primary focus:ring-primary" 
                        onChange={() => handleAnswerChange(i, opt)}
                        checked={answers[i] === opt}
                      />
                      <span className="font-medium text-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'short_answer' && (
                <div className="space-y-3">
                  <textarea 
                    className="w-full min-h-[120px] rounded-xl border-2 border-border p-4 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-card text-foreground outline-none"
                    placeholder="Type your answer here..."
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    value={answers[i] || ''}
                  />
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-4">
                  {['True', 'False'].map(opt => (
                    <label key={opt} className="flex-1 flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input 
                        type="radio" 
                        name={`q_${i}`} 
                        className="w-4 h-4 text-primary focus:ring-primary" 
                        onChange={() => handleAnswerChange(i, opt)}
                        checked={answers[i] === opt}
                      />
                      <span className="font-medium text-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
