import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, Button, Input, Badge } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { useAuditorSignIn, useAuditorSignUp, useGetAuditorExams, useGetAuditorSessions, useGetStudentLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Search, ShieldAlert, MonitorOff, Keyboard, MousePointerClick, ChevronRight, X, User, LogIn, UserPlus, LogOut, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditorDashboard() {
  const { isAuthenticated, login, logout, username } = useAuth("auditor");
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const signInMutation = useAuditorSignIn();
  const signUpMutation = useAuditorSignUp();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    signInMutation.mutate({ data: { username: usernameInput, password } }, {
      onSuccess: (res) => login(res.token, res.username),
      onError: () => setError("Invalid username or password"),
    });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Full name is required"); return; }
    signUpMutation.mutate({ data: { username: usernameInput, password, fullName } }, {
      onSuccess: (res) => login(res.token, res.username),
      onError: (err: any) => setError(err?.data?.error ?? "Registration failed"),
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-950/50 p-4 min-h-screen">
          <Card className="w-full max-w-md p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Auditor Access</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in to monitor active exam sessions</p>
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
                  <Input placeholder="Username" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} required />
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  {error && <p className="text-destructive text-sm font-medium text-center">{error}</p>}
                  <Button type="submit" className="w-full" isLoading={signInMutation.isPending}>Sign In</Button>
                  <p className="text-center text-sm text-muted-foreground">
                    No account yet?{" "}
                    <button type="button" onClick={() => setTab("signup")} className="text-primary font-semibold hover:underline">Register here</button>
                  </p>
                </motion.form>
              ) : (
                <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignUp} className="space-y-4">
                  <Input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  <Input placeholder="Username" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} required />
                  <Input type="password" placeholder="Create Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  {error && <p className="text-destructive text-sm font-medium text-center">{error}</p>}
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

  return <DashboardView username={username} onLogout={logout} />;
}

function DashboardView({ username, onLogout }: { username: string | null; onLogout: () => void }) {
  const [selectedExamId, setSelectedExamId] = useState<number | undefined>();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: examsData } = useGetAuditorExams({ query: { refetchInterval: 10000 } });
  const { data: sessionsData, isLoading: loadingSessions } = useGetAuditorSessions(
    { examId: selectedExamId },
    { query: { refetchInterval: 5000 } }
  );

  const sessions = sessionsData?.sessions || [];
  const filteredSessions = sessions.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const highRiskCount = sessions.filter(s => s.trustScore < 40).length;
  const avgTrust = sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.trustScore, 0) / sessions.length) : 0;

  return (
    <Layout title="Auditor Dashboard">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Active Exams</h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exams..."
                className="w-full bg-secondary border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedExamId(undefined)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${!selectedExamId ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "hover:bg-secondary text-foreground"}`}
            >
              <div className="font-semibold">All Exams</div>
              <div className="text-xs opacity-80">Global View</div>
            </button>
            {examsData?.exams.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedExamId === exam.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "hover:bg-secondary text-foreground"}`}
              >
                <div className="font-semibold truncate">{exam.title}</div>
                <div className="text-xs opacity-80 flex justify-between">
                  <span className="font-mono">{exam.joinCode}</span>
                  <span>{exam.studentCount} joined</span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">{username}</div>
                  <div className="text-xs text-muted-foreground">Auditor</div>
                </div>
              </div>
              <button onClick={onLogout} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-destructive" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 dark:bg-slate-950/50 flex flex-col relative overflow-y-auto">
          <div className="p-8">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="text-sm font-semibold text-muted-foreground mb-1">Total Monitored Sessions</div>
                <div className="text-4xl font-bold text-foreground">{sessions.length}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm font-semibold text-muted-foreground mb-1">Average Trust Score</div>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-bold text-foreground">{avgTrust}%</div>
                  <div className={`text-sm font-medium mb-1 ${avgTrust > 70 ? "text-success" : avgTrust > 40 ? "text-warning" : "text-destructive"}`}>
                    {avgTrust > 70 ? "Healthy" : avgTrust > 40 ? "Warning" : "Critical"}
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-destructive/5 border-destructive/20">
                <div className="text-sm font-semibold text-destructive/80 mb-1">High Risk Students</div>
                <div className="text-4xl font-bold text-destructive">{highRiskCount}</div>
              </Card>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by student name or USN..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Table */}
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary text-secondary-foreground text-xs uppercase tracking-wider border-b">
                      <th className="px-6 py-4 font-semibold">Student</th>
                      <th className="px-6 py-4 font-semibold">Exam</th>
                      <th className="px-6 py-4 font-semibold">Joined At</th>
                      <th className="px-6 py-4 font-semibold">Violations</th>
                      <th className="px-6 py-4 font-semibold">Trust Score</th>
                      <th className="px-6 py-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingSessions && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading sessions...</td></tr>
                    )}
                    {filteredSessions.map(session => (
                      <tr key={session.sessionId} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{session.studentName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{session.usn}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{session.examTitle}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {format(new Date(session.joinedAt), "HH:mm:ss")}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={session.violationCount > 5 ? "destructive" : session.violationCount > 0 ? "warning" : "default"}>
                            {session.violationCount} events
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-full bg-secondary rounded-full h-2.5 max-w-[100px]">
                              <div
                                className={`h-2.5 rounded-full ${session.trustScore > 70 ? "bg-success" : session.trustScore > 40 ? "bg-warning" : "bg-destructive"}`}
                                style={{ width: `${session.trustScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{session.trustScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedStudentId(session.studentId)}>
                            View Logs <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredSessions.length === 0 && !loadingSessions && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No sessions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Slide-over Panel for Student Logs */}
          <AnimatePresence>
            {selectedStudentId && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-foreground/20 backdrop-blur-sm z-10"
                  onClick={() => setSelectedStudentId(null)}
                />
                <motion.div
                  initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-background border-l shadow-2xl z-20 flex flex-col"
                >
                  <StudentLogPanel studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

function StudentLogPanel({ studentId, onClose }: { studentId: number; onClose: () => void }) {
  const { data, isLoading } = useGetStudentLogs(studentId, { query: { refetchInterval: 5000 } });

  const getIcon = (type: string) => {
    switch (type) {
      case "TAB_SWITCH": return <MonitorOff className="w-4 h-4 text-warning" />;
      case "KEYBOARD_ATTEMPT": return <Keyboard className="w-4 h-4 text-destructive" />;
      case "WINDOW_RESIZE": return <MonitorOff className="w-4 h-4 text-warning" />;
      case "IDLE_DETECTED": return <MousePointerClick className="w-4 h-4 text-muted-foreground" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="p-6 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{data?.studentName ?? "Loading..."}</h3>
            <p className="text-sm text-muted-foreground font-mono">{data?.usn}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-6">Violation Timeline</h4>
        {isLoading || !data ? (
          <div className="text-center text-muted-foreground py-12">Loading timeline...</div>
        ) : data.violations.length === 0 ? (
          <div className="text-center p-8 bg-success/5 border border-success/20 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
            <p className="font-semibold text-success">Clean Record</p>
            <p className="text-sm text-success/80 mt-1">No violations detected for this session.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-4 space-y-8">
            {data.violations.map((v: any, i: number) => (
              <div key={i} className="relative pl-8">
                <div className="absolute -left-[17px] top-1 w-8 h-8 bg-white border-2 border-border rounded-full flex items-center justify-center shadow-sm">
                  {getIcon(v.type)}
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-foreground">{v.type.replace(/_/g, " ")}</span>
                    <span className="text-xs font-mono text-muted-foreground">{format(new Date(v.timestamp), "HH:mm:ss")}</span>
                  </div>
                  <pre className="text-xs bg-secondary p-2 rounded text-muted-foreground overflow-x-auto">
                    {JSON.stringify(v.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
