
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp, query, where, limit } from 'firebase/firestore';
import { z } from 'zod';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import type { GuestbookMessage } from '@/types';

const GuestbookSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus terdiri dari minimal 2 karakter.' }),
  message: z.string().min(5, { message: 'Pesan harus terdiri dari minimal 5 karakter.' }).max(500, { message: 'Pesan tidak boleh melebihi 500 karakter.' }),
});

const initialState = {
  message: '',
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Mengirim...' : 'Kirim Ucapan'}
    </Button>
  );
}

export function GuestbookForm({ guestbookCollectionName, guestName }: { guestbookCollectionName: string, guestName?: string | null }) {
  const { firestore } = useFirebase();
  const [state, setState] = useState(initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [nameValue, setNameValue] = useState(guestName ?? '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setNameValue(guestName ?? '');
  }, [guestName]);

  const existingMessageQuery = useMemoFirebase(() => {
    if (!firestore || !guestName) return null;
    return query(
        collection(firestore, guestbookCollectionName),
        where("name", "==", guestName),
        limit(1)
    );
  }, [firestore, guestbookCollectionName, guestName]);

  const { data: existingMessage, isLoading: isLoadingExistingMessage } = useCollection<GuestbookMessage>(existingMessageQuery);

  useEffect(() => {
    if (existingMessage && existingMessage.length > 0) {
      setIsSubmitted(true);
    }
  }, [existingMessage]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const validatedFields = GuestbookSchema.safeParse({
      name: formData.get('name'),
      message: formData.get('message'),
    });

    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      setState({ message: 'Harap perbaiki kesalahan di bawah ini.', errors: fieldErrors });
      toast({
        title: "Error",
        description: "Harap perbaiki kesalahan di bawah ini.",
        variant: "destructive",
      });
      return;
    }
    
    if (!firestore) {
        toast({ title: "Error", description: "Tidak dapat terhubung ke database.", variant: "destructive" });
        return;
    }

    const guestbookData = {
        ...validatedFields.data,
        createdAt: Timestamp.now(),
    };

    try {
        const guestbookCol = collection(firestore, guestbookCollectionName);
        addDocumentNonBlocking(guestbookCol, guestbookData);

        toast({
            title: "Berhasil!",
            description: "Ucapan Anda telah dikirim!",
        });
        setIsSubmitted(true);
    } catch (e) {
        console.error("Error adding document: ", e);
        toast({
            title: "Error",
            description: "Terjadi kesalahan tak terduga.",
            variant: "destructive",
        });
    }
  };
  
  if (isLoadingExistingMessage) {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <p className="font-medium text-foreground">Memeriksa ucapan...</p>
            </CardContent>
        </Card>
    );
  }

  if (isSubmitted) {
      return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="font-medium text-foreground">Terima kasih atas ucapannya!</p>
            </CardContent>
        </Card>
      );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guestbook-name">Nama Anda</Label>
        <Input 
          id="guestbook-name" 
          name="name" 
          placeholder="Nama Anda" 
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)} 
        />
        {state.errors?.name && <p className="text-destructive text-sm">{state.errors.name[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="guestbook-message">Ucapan Anda</Label>
        <Textarea id="guestbook-message" name="message" placeholder="Tulis ucapan Anda di sini..." />
        {state.errors?.message && <p className="text-destructive text-sm">{state.errors.message[0]}</p>}
      </div>
      <SubmitButton />
    </form>
  );
}
