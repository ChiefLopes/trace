"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, fieldErrorId } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

import { getGoogleAuthUrlAction, signupAction } from "../actions";
import { PASSWORD_MIN_LENGTH, signupSchema } from "../schemas";
import { FormAlert } from "@/components/ui/form-alert";
import { type OAuthProvider, oauthProviderName, SocialSignIn } from "./social-sign-in";

export function SignupForm() {
  const router = useRouter();
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
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
      const result = await signupAction(values);
      if ("error" in result) {
        setError("root", { message: result.error });
        return;
      }
      toast.success(`Welcome, ${result.displayName.split(" ")[0]}`, {
        description: "Your case files are ready.",
      });
      router.replace(result.redirectTo);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Something went wrong. Try again.",
      });
    }
  });

  const describedBy = (name: keyof typeof errors) =>
    errors[name] ? fieldErrorId(name) : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={errors.root?.message} />

      <Field id="username" label="User Name" error={errors.username?.message}>
        <Input
          id="username"
          autoComplete="username"
          placeholder="alex_trace"
          aria-invalid={!!errors.username}
          aria-describedby={describedBy("username")}
          {...register("username")}
        />
      </Field>

      <Field id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="alex@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email")}
          {...register("email")}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
          aria-invalid={!!errors.password}
          aria-describedby={describedBy("password")}
          {...register("password")}
        />
      </Field>

      <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={describedBy("confirmPassword")}
          {...register("confirmPassword")}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? "Creating account…" : "Sign up"}
      </Button>

      <SocialSignIn
        label="Sign up with"
        isLoading={isSocialLoading}
        onContinue={handleSocialContinue}
      />
    </form>
  );
}
