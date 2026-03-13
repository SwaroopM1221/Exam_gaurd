import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ShieldCheck, LogOut, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface LayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  backLink?: string;
  title?: string;
}

export function Layout({ children, showNav = true, backLink, title }: LayoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {showNav && (
        <header className="glass-panel sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {backLink && (
                <Link href={backLink} className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              )}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
                  Guardrail
                </span>
              </Link>
              {title && (
                <>
                  <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
                  <h1 className="font-semibold text-foreground/80">{title}</h1>
                </>
              )}
            </div>
            
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/teacher" className="text-foreground/80 dark:text-muted-foreground hover:text-primary transition-colors">Teachers</Link>
              <Link href="/student" className="text-foreground/80 dark:text-muted-foreground hover:text-primary transition-colors">Students</Link>
              <Link href="/auditor" className="text-foreground/80 dark:text-muted-foreground hover:text-primary transition-colors">Auditors</Link>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-foreground/80 dark:text-muted-foreground hover:text-primary"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {isAuthenticated && (
                <button 
                  onClick={() => { logout(); window.location.href = '/auditor'; }}
                  className="ml-4 flex items-center gap-2 text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 px-3 py-1.5 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </nav>
          </div>
        </header>
      )}
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      
      {showNav && (
        <footer className="py-8 text-center text-sm text-muted-foreground mt-auto border-t border-border bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
          <p>© {new Date().getFullYear()} Exam Guardrail System. Academic Integrity First.</p>
        </footer>
      )}
    </div>
  );
}
