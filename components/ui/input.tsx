import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
