import React from "react";
import { cn } from "@/lib/utils";

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "bg-white rounded-xl border border-gray-200 shadow-sm",
      className
    )}
  >
    {children}
  </div>
);

export const CardHeader = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn("px-6 py-4 border-b border-gray-100", className)}>
    {children}
  </div>
);

export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <h3 className={cn("text-base font-semibold text-gray-900", className)}>
    {children}
  </h3>
);

export const CardContent = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => <div className={cn("p-6", className)}>{children}</div>;

export const CardFooter = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl",
      className
    )}
  >
    {children}
  </div>
);
