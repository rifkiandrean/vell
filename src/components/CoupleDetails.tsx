'use client';

import Image from 'next/image';
import { SectionTitle } from './SectionTitle';
import type { WeddingDetails } from '@/types';
import { getGoogleDriveFileUrl } from '@/lib/utils';

function PersonDetail({ name, parents, imageUrl }: { name?: string; parents?: string; imageUrl?: string | null; }) {
    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary/50 shadow-lg mb-4">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name || 'Mempelai'}
                        layout="fill"
                        objectFit="cover"
                        className="transition-transform duration-500 hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full bg-accent/30 flex items-center justify-center">
                        <span className="text-sm text-foreground/60">Foto</span>
                    </div>
                )}
            </div>
            <h3 className="font-display text-4xl text-primary">{name}</h3>
            <p className="mt-2 text-foreground/80 max-w-xs">{parents}</p>
        </div>
    );
}


export function CoupleDetails({ details }: { details: WeddingDetails }) {
    return (
        <>
            <SectionTitle className="font-normal tracking-normal">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</SectionTitle>
             <p className="text-center text-foreground/70 -mt-8 mb-8">Assalamualaikum warahmatullahi wabarakatuh</p>
            <p className="text-center max-w-2xl mx-auto mb-12 text-foreground/70">
                Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-start">
                <PersonDetail 
                    name={details.groomName} 
                    parents={details.groomParents} 
                    imageUrl={getGoogleDriveFileUrl(details.groomImageUrl)} 
                />
                <PersonDetail 
                    name={details.brideName} 
                    parents={details.brideParents} 
                    imageUrl={getGoogleDriveFileUrl(details.brideImageUrl)} 
                />
            </div>
        </>
    );
}
