import * as React from "react"
import Link from "next/link"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="breadcrumb"
      aria-label="breadcrumb"
      className={cn(className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium break-words",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}

interface BreadcrumbLinkProps extends React.ComponentProps<"a"> {
  href?: string;
}

function BreadcrumbLink({
  className,
  href,
  children,
  ...props
}: BreadcrumbLinkProps) {
  if (href) {
    return (
      <Link
        data-slot="breadcrumb-link"
        href={href}
        className={cn(
          "transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-1 py-0.5",
          className
        )}
        {...props}
      >
        {children}
      </Link>
    )
  }

  return (
    <a
      data-slot="breadcrumb-link"
      className={cn(
        "transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded px-1 py-0.5",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-semibold text-slate-900 truncate max-w-[200px]", className)}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&_svg]:size-3 text-slate-300 shrink-0", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-6 items-center justify-center text-slate-400", className)}
      {...props}
    >
      <MoreHorizontal className="size-3.5" />
      <span className="sr-only">Mais opções</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
