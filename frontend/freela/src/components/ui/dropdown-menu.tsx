"use client";

import * as React from "react";
import { Menu } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

function DropdownMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Menu.Root>{children}</Menu.Root>;
}

function DropdownMenuTrigger({
  asChild,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Menu.Trigger> & {
  asChild?: boolean;
}) {
  if (asChild && React.isValidElement(children)) {
    return <Menu.Trigger render={children} {...props} />;
  }

  return <Menu.Trigger {...props}>{children}</Menu.Trigger>;
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 8,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Menu.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof Menu.Positioner>["align"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof Menu.Positioner>["sideOffset"];
}) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={sideOffset}>
        <Menu.Popup
          className={cn(
            "z-50 min-w-44 overflow-hidden rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-md outline-none",
            className,
          )}
          {...props}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

function DropdownMenuItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Menu.Separator>) {
  return (
    <Menu.Separator
      className={cn("-mx-1 my-1 h-px bg-border/70", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
};
