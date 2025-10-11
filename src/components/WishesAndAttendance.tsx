
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RsvpForm } from "./RsvpForm";
import { Guestbook } from "./Guestbook";
import { SectionTitle } from "./SectionTitle";
import { Card } from "./ui/card";

export function WishesAndAttendance({ 
    rsvpCollectionName, 
    guestbookCollectionName,
    guestName,
}: { 
    rsvpCollectionName: string; 
    guestbookCollectionName: string;
    guestName?: string | null;
}) {
    // Determine the default tab. If there's no guestName, default to guestbook.
    const defaultTab = guestName ? "rsvp" : "guestbook";
    
    return (
        <div className="w-full">
            <SectionTitle>Ucapan & Kehadiran</SectionTitle>
             <Card className="max-w-lg mx-auto shadow-lg border-accent/50">
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        {/* Disable RSVP tab if there's no guest name */}
                        <TabsTrigger value="rsvp" disabled={!guestName}>Konfirmasi Kehadiran</TabsTrigger>
                        <TabsTrigger value="guestbook">Kirim Ucapan</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rsvp" className="p-0">
                        {/* Only render RsvpForm if guestName exists */}
                        {guestName && <RsvpForm rsvpCollectionName={rsvpCollectionName} isCard={false} guestName={guestName} />}
                    </TabsContent>
                    <TabsContent value="guestbook" className="p-0">
                        <Guestbook guestbookCollectionName={guestbookCollectionName} isCard={false} guestName={guestName} />
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
