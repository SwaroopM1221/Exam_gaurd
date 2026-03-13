import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui";
import { motion } from "framer-motion";
import { GraduationCap, ShieldAlert, MonitorCheck, ScrollText } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col justify-center items-center py-20 px-4 relative overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8">
            <ShieldAlert className="w-4 h-4" />
            <span>Next-Generation Exam Security</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            Academic integrity, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">guaranteed.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Guardrail provides real-time behavior monitoring, trust scoring, and an uncompromised environment for remote assessments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/student" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base h-14 px-8 rounded-2xl group">
                <GraduationCap className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                I am a Student
              </Button>
            </Link>
            <Link href="/teacher" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-base h-14 px-8 rounded-2xl bg-white/50 dark:bg-white/10 backdrop-blur-sm group">
                <ScrollText className="mr-2 w-5 h-5 group-hover:text-primary transition-colors" />
                I am a Teacher
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto z-10"
        >
          <div className="glass-card p-6 rounded-3xl">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <MonitorCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Monitoring</h3>
            <p className="text-muted-foreground">Detects tab switching, window resizing, and forbidden keystrokes in real-time.</p>
          </div>
          <div className="glass-card p-6 rounded-3xl">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trust Scoring</h3>
            <p className="text-muted-foreground">Automated behavioral analysis generates a reliable trust score for every session.</p>
          </div>
          <div className="glass-card p-6 rounded-3xl">
            <div className="w-12 h-12 bg-warning/10 text-warning rounded-2xl flex items-center justify-center mb-4">
              <ScrollText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Auditor Dashboard</h3>
            <p className="text-muted-foreground">Comprehensive timeline views of all violations across all student sessions.</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
