"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, fieldErrorId } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

import { getGoogleAuthUrlAction, loginAction } from "../actions";
import { loginSchema } from "../schemas";
import { FormAlert } from "@/components/ui/form-alert";
import { type OAuthProvider, oauthProviderName, SocialSignIn } from "./social-sign-in";

export function LoginForm() {
  const router = useRouter();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
    // Validate a field once the user leaves it, then live as they fix it.
    mode: "onTouched",
  });

  const handleSocialContinue = async (provider: OAuthProvider) => {
    if (provider === "google") {
      setIsSocialLoading(true);
      try {
        const result = await getGoogleAuthUrlAction();
        if ("error" in result) {
          toast.error(result.error);
          setIsSocialLoading(false);
          return;
        }
        if (result.url.includes("GOOGLE_CLIENT_ID_NOT_CONFIGURED")) {
          toast.info("Google Sign-In is not configured yet", {
            description:
              "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.",
          });
          setIsSocialLoading(false);
          return;
        }
        window.location.href = result.url;
      } catch {
        toast.error("Couldn't reach the server. Please try again.");
        setIsSocialLoading(false);
      }
    } else {
      toast.info(`${oauthProviderName[provider]} sign-in is coming soon`, {
        description: "Use email and password sign-in for now.",
      });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Where the Proxy was sending the player before login; validated on the server.
      const next = new URLSearchParams(window.location.search).get("next");
      const result = await loginAction(values, next);
      if ("error" in result) {
        setError("root", { message: result.error });
        return;
      }
      toast.success(`Welcome back, ${result.displayName.split(" ")[0]}`, {
        description: "Your case files are unlocked.",
      });
      router.replace(result.redirectTo);
    } catch {
      setError("root", {
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={errors.root?.message} />

      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="alex@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? fieldErrorId("email") : undefined}
          {...register("email")}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? fieldErrorId("password") : undefined}
          {...register("password")}
        />
      </Field>

      <div className="flex items-center justify-between gap-4 text-xs">
        <label className="flex items-center gap-2 text-foreground/90">
          <input type="checkbox" className="size-4 accent-accent" {...register("remember")} />
          Remember me
        </label>
        <Link
          href={"/forgot-password" as Route}
          className="text-foreground/90 underline-offset-4 hover:text-accent hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Logging in…" : "Login"}
      </Button>

      <SocialSignIn
        label="Continue with"
        isLoading={isSocialLoading}
        onContinue={handleSocialContinue}
      />
    </form>
  );
}
