'use client';

import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { getGoogleDriveFileUrl } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

export function Hero({ coupleName, eventDate, quote, targetDate, targetTime }: { coupleName: string, eventDate: string, quote?: string, targetDate?: string, targetTime?: string }) {
    const names = coupleName.split(' & ');
    const brideName = names[0];
    const groomName = names[1];

    return (
        <header className="relative w-full min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                 {quote && (
                    <blockquote className="font-body text-base md:text-lg italic text-foreground/60 mb-4 max-w-2xl mx-auto">
                        "{quote}"
                    </blockquote>
                 )}
                <p className="font-body text-lg md:text-xl tracking-widest uppercase text-foreground/80 mb-4 mt-8">
                    We are getting married
                </p>
                <div className="font-display text-7xl md:text-9xl text-primary leading-tight">
                    <h1>{brideName}</h1>
                    <h2 className="text-5xl md:text-7xl">&</h2>
                    <h1>{groomName}</h1>
                </div>
                <HeartIcon className="w-8 h-8 text-primary/80 mx-auto my-6 animate-pulse" />
                <p className="font-body text-lg md:text-xl text-foreground/80 font-bold">
                    {eventDate}
                </p>
                {targetDate && <CountdownTimer targetDate={targetDate} targetTime={targetTime} />}
            </div>
        </header>
    );
}
