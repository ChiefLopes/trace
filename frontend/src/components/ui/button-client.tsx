"use client";

import {
  useState,
  type ComponentProps,
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Route } from "next";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { buttonVariants, type ButtonSize, type ButtonVariant } from "./button-variants";

interface CommonButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
  isLoading?: boolean;
  loadingText?: ReactNode;
  preventDoubleClick?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  children?: ReactNode;
}

export type ButtonProps = CommonButtonProps &
  (
    | (ComponentProps<"button"> & { href?: undefined })
    | (Omit<ComponentProps<typeof Link>, "href"> & { href: Route | string })
  );

export function ButtonClient({
  variant,
  size,
  className,
  loading: externalLoading,
  isLoading: externalIsLoading,
  loadingText,
  preventDoubleClick = true,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const [internalClicked, setInternalClicked] = useState(false);

  // If inside a form, automatically detect pending submission
  let formPending = false;
  try {
    const formStatus = useFormStatus();
    formPending = formStatus.pending;
  } catch {
    // Outside of form context
  }

  const isLoading = Boolean(externalLoading || externalIsLoading || formPending || internalClicked);

  const isSubmitButton =
    !("href" in props) && (props as ComponentProps<"button">).type === "submit";

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }

    if (preventDoubleClick && !isSubmitButton) {
      setInternalClicked(true);
      // Auto-reset after timeout if page transition doesn't unmount
      setTimeout(() => setInternalClicked(false), 3000);
    }

    if (onClick) {
      const result = (onClick as (event: MouseEvent<HTMLElement>) => unknown)(e);
      if (result instanceof Promise) {
        setInternalClicked(true);
        result.finally(() => {
          setInternalClicked(false);
        });
      }
    }
  };

  const content = (
    <>
      {isLoading && (
        <Loader2 className="size-4 shrink-0 animate-spin text-current" aria-hidden="true" />
      )}
      {isLoading && loadingText ? loadingText : children}
    </>
  );

  const combinedClassName = cn(
    buttonVariants({ variant, size, className }),
    isLoading && "pointer-events-none cursor-wait opacity-85",
  );

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link
        href={href as Route}
        className={combinedClassName}
        aria-busy={isLoading}
        aria-disabled={disabled || isLoading}
        onClick={handleClick as MouseEventHandler<HTMLAnchorElement>}
        {...linkProps}
      >
        {content}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = props as ComponentProps<"button">;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={combinedClassName}
      onClick={handleClick as MouseEventHandler<HTMLButtonElement>}
      {...buttonProps}
    >
      {content}
    </button>
  );
}
