"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getSocialLoginUrl,
  type SocialProvider,
} from "@/lib/social-auth";

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

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.5 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.22-3.37-1.22-.46-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .08 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.09 0-1.13.39-2.06 1.03-2.79-.1-.26-.45-1.32.1-2.74 0 0 .84-.28 2.75 1.07A9.3 9.3 0 0 1 12 6.82c.85 0 1.7.12 2.5.36 1.9-1.35 2.74-1.07 2.74-1.07.56 1.42.21 2.48.11 2.74.64.73 1.03 1.66 1.03 2.79 0 3.96-2.34 4.82-4.57 5.08.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.6.69.5A10.26 10.26 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3C4.16 3 3.3 3.89 3.3 5c0 1.1.86 2 1.95 2s1.95-.9 1.95-2c0-1.11-.86-2-1.95-2ZM20.7 12.78c0-3.15-1.68-4.62-3.93-4.62-1.81 0-2.62 1.01-3.07 1.72V8.5H10.3c.04.92 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.12-.92.27-.68.88-1.39 1.91-1.39 1.35 0 1.89 1.05 1.89 2.59V20H21c0 0 .04-6.2.04-7.22Z" />
    </svg>
  );
}

const providers: Array<{
  id: SocialProvider;
  label: string;
  Icon: () => JSX.Element;
}> = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
  { id: "linkedin_oauth2", label: "LinkedIn", Icon: LinkedInIcon },
];

type SocialAuthButtonsProps = {
  activeProvider: SocialProvider | null;
  onStart: (provider: SocialProvider) => void;
};

export function SocialAuthButtons({
  activeProvider,
  onStart,
}: SocialAuthButtonsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {providers.map(({ id, label, Icon }) => {
        const isLoading = activeProvider === id;

        return (
          <Button
            key={id}
            type="button"
            variant="outline"
            disabled={activeProvider !== null}
            onClick={() => {
              onStart(id);
              window.location.href = getSocialLoginUrl(id);
            }}
            className="h-11 justify-center rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Icon />
            )}
            {label}
          </Button>
        );
      })}
    </div>
  );
}
