"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  showToggle?: boolean;
  error?: boolean;
}

export function PasswordInput({
  showToggle = true,
  error = false,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn(
          "w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none focus:border-black transition-colors font-zalando",
          error
            ? "border-red-500"
            : className.includes("border-")
              ? ""
              : "border-black",
          className
        )}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black transition-colors focus:outline-none"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );
}
