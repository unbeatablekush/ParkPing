"use client";

import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg focus:ring-primary/50",
      secondary: "bg-secondary text-white hover:bg-secondary-hover shadow-md hover:shadow-lg focus:ring-secondary/50",
      outline: "border-2 border-gray-200 bg-transparent text-gray-900 focus:ring-gray-200 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-md focus:ring-red-500/50",
      success: "bg-success text-white hover:bg-emerald-600 shadow-md focus:ring-success/50",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg font-medium",
      icon: "h-10 w-10 flex items-center justify-center p-0",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
        whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
        className={cn(
          "relative inline-flex flex-shrink-0 items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden",
          variants[variant],
          sizes[size],
          (disabled || isLoading) && "opacity-70 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        <span className={cn("inline-flex items-center gap-2", isLoading && "opacity-80")}>
          {children}
        </span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button };
