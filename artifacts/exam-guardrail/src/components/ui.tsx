import React, { InputHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Card({ children, className = '', ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-2xl p-6 shadow-xl shadow-primary/5 border border-border/60 ${className}`} 
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  isLoading?: boolean;
}

export function Button({ children, variant = 'primary', isLoading, className = '', ...props }: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5 focus:ring-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    outline: "border-2 border-border bg-transparent text-foreground hover:bg-muted focus:ring-primary",
    ghost: "bg-transparent text-foreground hover:bg-muted/50 focus:ring-primary",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20 focus:ring-destructive",
  };

  const sizes = "px-5 py-2.5 text-sm";

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ className = '', error, ...props }: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div className="w-full">
      <input 
        className={`w-full bg-background border-2 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground transition-all duration-200 outline-none
        ${error ? 'border-destructive focus:border-destructive focus:ring-4 focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-4 focus:ring-primary/10'} 
        ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function Label({ children, className = '', required }: { children: React.ReactNode, className?: string, required?: boolean }) {
  return (
    <label className={`block text-sm font-semibold text-foreground mb-1.5 ${className}`}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

export function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default'|'success'|'warning'|'destructive', className?: string }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/10 text-success border border-success/20",
    warning: "bg-warning/10 text-warning-foreground border border-warning/20",
    destructive: "bg-destructive/10 text-destructive border border-destructive/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
