"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

import { Input } from "./input";

/** Password field with a show/hide toggle. */
export function PasswordInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-gray-500 hover:text-background active:scale-90 active:text-background"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
