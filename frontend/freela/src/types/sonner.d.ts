declare module "sonner" {
  import type * as React from "react";

  export interface ToastOptions {
    classNames?: {
      toast?: string;
    };
  }

  export interface ToasterProps {
    theme?: "light" | "dark" | "system";
    className?: string;
    icons?: Record<string, React.ReactNode>;
    style?: React.CSSProperties;
    toastOptions?: ToastOptions;
  }

  export const Toaster: React.ComponentType<ToasterProps>;

  export const toast: {
    success(message: string): void;
    error(message: string): void;
    info?(message: string): void;
    warning?(message: string): void;
    loading?(message: string): void;
  };
}