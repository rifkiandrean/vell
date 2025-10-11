import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionWrapper({ children, id, className }: { children: React.ReactNode, id?: string, className?: string }) {
  return (
    <section id={id} className={cn("w-full max-w-4xl mx-auto px-6 py-16 sm:py-24 animate-in fade-in duration-700", className)}>
      {children}
    </section>
  );
}
