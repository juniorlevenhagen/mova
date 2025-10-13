"use client";

import React, { type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const animationProps = {
  initial: { "--x": "100%", scale: 0.8 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
} as HTMLMotionProps<"button">;

interface ShinyButtonProps {
  children: ReactNode;
  className?: string;
}

const ShinyButton = ({ children, className, ...props }: ShinyButtonProps) => {
  return (
    <motion.button
      {...animationProps}
      {...props}
      className={cn(
        "relative rounded-lg px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow",
        className
      )}
    >
      <span className="relative block size-full uppercase tracking-wide text-white">
        {children}
      </span>
      <span
        className="absolute inset-0 z-10 block rounded-[inherit] pointer-events-none"
        style={{
          background: `linear-gradient(-75deg, transparent calc(var(--x) + 0%), rgba(255, 255, 255, 0.33) calc(var(--x) + 50%), transparent calc(var(--x) + 100%))`,
        }}
      ></span>
    </motion.button>
  );
};

export { ShinyButton };
