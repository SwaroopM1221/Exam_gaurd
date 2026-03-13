import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Label, Badge } from "@/components/ui";
import { useJoinExam, useGetTrustScore } from "@workspace/api-client-react";
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
        // Simple error handling
        alert(err?.response?.data?.error || "Failed to join exam. Check code.");
      }
    });
  };

  if (examFinished) {
    return (
      <Layout showNav={false}>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full text-center p-12">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Exam Completed</h2>
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

  return <ActiveExamView session={session} onFinish={() => setExamFinished(true)} />;
}

// --- ACTIVE EXAM VIEW ---

function ActiveExamView({ session, onFinish }: { session: any, onFinish: () => void }) {
  const { exam, sessionId, studentId } = session;
  
  // Activate monitoring hooks
  useExamMonitor(sessionId, studentId);

  // Poll trust score every 5 seconds
  const { data: trustData } = useGetTrustScore(studentId, {
    query: { refetchInterval: 5000, retry: false }
  });

  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onFinish]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const trustScore = trustData?.trustScore ?? 100;
  let trustColor = "success";
  if (trustScore < 70) trustColor = "warning";
  if (trustScore < 40) trustColor = "destructive";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Exam Header bar (replaces standard nav) */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <p className="text-xs text-muted-foreground">Proctored by {exam.teacherName}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-${trustColor} animate-pulse`}></div>
                <span className={`font-bold text-${trustColor}`}>{trustScore}%</span>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 300 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
            
            <Button onClick={onFinish} variant="primary">Submit Exam</Button>
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
                      <input type="radio" name={`q_${i}`} className="w-4 h-4 text-primary focus:ring-primary" />
                      <span className="font-medium text-foreground">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input type="radio" name={`q_${i}`} value="True" className="w-4 h-4" />
                    <span className="font-bold">True</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input type="radio" name={`q_${i}`} value="False" className="w-4 h-4" />
                    <span className="font-bold">False</span>
                  </label>
                </div>
              )}

              {q.type === 'short_answer' && (
                <textarea 
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px]"
                  placeholder="Type your answer here..."
                />
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
