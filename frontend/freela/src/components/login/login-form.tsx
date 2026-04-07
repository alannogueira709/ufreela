import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        d="M21.8 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.49a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.05-4.4 3.05-7.67Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.75 0 5.06-.91 6.74-2.47l-3.3-2.56c-.92.62-2.09.99-3.44.99-2.64 0-4.88-1.78-5.68-4.17H2.9v2.63A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.32 13.79A5.98 5.98 0 0 1 6 12c0-.62.11-1.23.32-1.79V7.58H2.9a10 10 0 0 0 0 8.84l3.42-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.04c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.05 2.99 14.74 2 12 2A10 10 0 0 0 2.9 7.58l3.42 2.63C7.12 7.82 9.36 6.04 12 6.04Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup className="gap-5">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">
            Welcome back to uFreela
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Entre para acessar sua conta, acompanhar candidaturas e descobrir
            novas oportunidades.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <GoogleIcon />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <BriefcaseBusiness className="size-4" />
            Empresa
          </Button>
        </div>

        <FieldSeparator>Ou entre com email</FieldSeparator>

        <Field className="gap-2">
          <FieldLabel htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Email address
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="name@company.com"
            required
            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
          />
        </Field>

        <Field className="gap-2">
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Password
            </FieldLabel>
            <Link
              href="#"
              className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            required
            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm shadow-none placeholder:text-slate-400"
          />
        </Field>

        <Field>
          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in to Dashboard
          </Button>
        </Field>

        <FieldDescription className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline"
          >
            Request access
          </Link>
        </FieldDescription>

        <div className="border-t border-slate-100 pt-5 text-xs leading-6 text-slate-400">
          By continuing, you agree to our Terms, Privacy Policy and platform
          usage guidelines.
        </div>
      </FieldGroup>
    </form>
  );
}
