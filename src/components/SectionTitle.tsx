import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionTitle({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <h2 className={cn("font-headline text-4xl md:text-5xl text-center text-primary mb-12", className)}>
            {children}
        </h2>
    )
}
