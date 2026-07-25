import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "destructive" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
