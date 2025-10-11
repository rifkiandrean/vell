
'use client';
import type { GuestbookMessage } from '@/types';
import { SectionTitle } from './SectionTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GuestbookForm } from './GuestbookForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { MessageSquare, CornerDownRight, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { toast } from '@/hooks/use-toast';

function GuestbookMessages({ guestbookCollectionName, guestName }: { guestbookCollectionName: string, guestName?: string | null }) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    
    const messagesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, guestbookCollectionName), orderBy('createdAt', 'desc'));
    }, [firestore, guestbookCollectionName]);

    const { data: messages, isLoading } = useCollection<GuestbookMessage>(messagesQuery);
    
    const handleLike = async (messageId: string) => {
        if (!firestore || !guestName) {
            toast({
                title: "Gagal",
                description: "Anda harus memiliki nama tamu untuk menyukai ucapan.",
                variant: "destructive",
            });
            return;
        }

        const messageRef = doc(firestore, guestbookCollectionName, messageId);
        const message = messages?.find(m => m.id === messageId);
        
        if (!message) return;

        const hasLiked = message.likes?.includes(guestName);

        try {
            if (hasLiked) {
                // Unlike
                await updateDoc(messageRef, {
                    likes: arrayRemove(guestName)
                });
            } else {
                // Like
                await updateDoc(messageRef, {
                    likes: arrayUnion(guestName)
                });
            }
        } catch (error) {
            console.error("Error updating like: ", error);
             toast({
                title: "Error",
                description: "Gagal memperbarui status suka.",
                variant: "destructive",
            });
        }
    };


    if (isLoading) {
        return <p className="text-center text-foreground/60 mt-8 px-6">Memuat ucapan...</p>;
    }

    if (!messages || messages.length === 0) {
        return <p className="text-center text-foreground/60 mt-8 px-6">Jadilah yang pertama memberikan ucapan!</p>;
    }

    return (
        <ScrollArea className="h-72 w-full mt-8 px-6">
            <div className="space-y-4">
                {messages.map((msg) => {
                    const likeCount = msg.likes?.length || 0;
                    const isLikedByCurrentUser = guestName ? msg.likes?.includes(guestName) : false;

                    return (
                    <Card key={msg.id} className="bg-accent/50 border-accent/30 overflow-hidden">
                        <CardContent className="p-4">
                            <p className="text-foreground/90">{msg.message}</p>
                            <div className="flex justify-between items-center mt-2">
                                <div>
                                    <p className="text-sm text-foreground/60">- {msg.name}</p>
                                    {msg.createdAt && <p className="text-xs text-foreground/50 mt-1">{format((msg.createdAt as unknown as Timestamp).toDate(), "PP")}</p>}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleLike(msg.id!)}
                                    disabled={!guestName}
                                    className="flex items-center gap-1 text-foreground/60 hover:text-primary"
                                >
                                    <Heart className={cn("w-4 h-4", isLikedByCurrentUser ? "fill-primary text-primary" : "")}/>
                                    <span className="text-sm">{likeCount}</span>
                                </Button>
                            </div>
                        </CardContent>
                        {msg.adminReply && (
                            <div className="bg-primary/10 p-4 border-t border-primary/20">
                                <div className="flex gap-3">
                                    <CornerDownRight className="w-5 h-5 text-primary/80 mt-1 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-primary text-sm">Balasan dari {msg.adminReplierName || 'mempelai'}:</p>
                                        <p className="text-foreground/80 italic text-sm">{msg.adminReply}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                    )
                })}
            </div>
        </ScrollArea>
    )
}

export function Guestbook({ guestbookCollectionName, isCard = true, guestName }: { guestbookCollectionName: string, isCard?: boolean, guestName?: string | null }) {
    if (!isCard) {
        return (
            <div className="w-full">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
                        <MessageSquare className="w-6 h-6"/>
                        Kirim Ucapan
                    </CardTitle>
                    <CardDescription>Bagikan kebahagiaan Anda melalui pesan.</CardDescription>
                </CardHeader>
                
                {guestName ? (
                    <CardContent>
                        <GuestbookForm guestbookCollectionName={guestbookCollectionName} guestName={guestName} />
                    </CardContent>
                ) : (
                    <CardContent>
                        <p className="text-center text-sm text-foreground/60 p-4 bg-accent/30 rounded-md">
                            Silakan buka undangan dengan nama Anda untuk dapat mengirim ucapan.
                        </p>
                    </CardContent>
                )}
                
                <CardHeader className="mt-4">
                    <CardTitle className="font-headline text-2xl">Ucapan dan Doa</CardTitle>
                </CardHeader>
                <GuestbookMessages guestbookCollectionName={guestbookCollectionName} guestName={guestName} />
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <SectionTitle>Buku Tamu</SectionTitle>
            <div className="max-w-lg mx-auto">
                <Card className="shadow-lg border-accent/50">
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Kirim Ucapan untuk Mempelai</CardTitle>
                    </CardHeader>
                    {guestName ? (
                         <CardContent>
                           <GuestbookForm guestbookCollectionName={guestbookCollectionName} guestName={guestName} />
                        </CardContent>
                    ) : (
                         <CardContent>
                            <p className="text-center text-sm text-foreground/60 p-4 bg-accent/30 rounded-md">
                                Silakan buka undangan dengan nama Anda untuk dapat mengirim ucapan.
                            </p>
                        </CardContent>
                    )}
                </Card>
                <GuestbookMessages guestbookCollectionName={guestbookCollectionName} guestName={guestName} />
            </div>
        </div>
    );
}
