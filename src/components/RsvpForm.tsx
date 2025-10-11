
'use client';

import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SectionTitle } from './SectionTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { collection, Timestamp, query, where, limit } from 'firebase/firestore';
import { z } from 'zod';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { Rsvp } from '@/types';

const RsvpSchema = z.object({
  name: z.string().min(2, { message: 'Nama harus terdiri dari minimal 2 karakter.' }),
  attending: z.enum(['yes', 'no'], { required_error: 'Silakan pilih status kehadiran Anda.' }),
});

const initialState = {
  message: '',
  errors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Mengirim...' : 'Kirim RSVP'}
    </Button>
  );
}

const RsvpFormContent = forwardRef((
    { rsvpCollectionName, guestName }: { rsvpCollectionName: string, guestName?: string | null; },
    ref
  ) => {
  const [state] = useState(initialState);
  const [nameValue, setNameValue] = useState(guestName ?? '');

  useEffect(() => {
    setNameValue(guestName ?? '');
  }, [guestName]);

  useImperativeHandle(ref, () => ({
    resetName: () => setNameValue(guestName ?? '')
  }));

  return (
    <>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Nama lengkap Anda" 
                  required 
                  value={nameValue} 
                  onChange={(e) => setNameValue(e.target.value)}
                />
                {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label>Apakah Anda akan hadir?</Label>
                <RadioGroup name="attending" className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes" />
                        <Label htmlFor="yes">Ya, saya akan hadir</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no">Maaf, tidak bisa</Label>
                    </div>
                </RadioGroup>
                {state?.errors?.attending && <p className="text-sm text-destructive">{state.errors.attending[0]}</p>}
            </div>
        </CardContent>
        <CardFooter>
            <SubmitButton />
        </CardFooter>
    </>
  );
});
RsvpFormContent.displayName = 'RsvpFormContent';


export function RsvpForm({ rsvpCollectionName, isCard = true, guestName }: { rsvpCollectionName: string, isCard?: boolean, guestName?: string | null }) {
  const { firestore } = useFirebase();
  const [state, setState] = useState(initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const formContentRef = useRef<{ resetName: () => void }>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const existingRsvpQuery = useMemoFirebase(() => {
    if (!firestore || !guestName) return null;
    return query(
        collection(firestore, rsvpCollectionName),
        where("name", "==", guestName),
        limit(1)
    );
  }, [firestore, rsvpCollectionName, guestName]);

  const { data: existingRsvp, isLoading: isLoadingExistingRsvp } = useCollection<Rsvp>(existingRsvpQuery);
  
  useEffect(() => {
    if (existingRsvp && existingRsvp.length > 0) {
      setIsSubmitted(true);
    }
  }, [existingRsvp]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const validatedFields = RsvpSchema.safeParse({
      name: formData.get('name'),
      attending: formData.get('attending'),
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

    const rsvpData = {
      ...validatedFields.data,
      createdAt: Timestamp.now(),
    };

    try {
      const rsvpsCol = collection(firestore, rsvpCollectionName);
      addDocumentNonBlocking(rsvpsCol, rsvpData);
      
      toast({
        title: "Berhasil!",
        description: "Terima kasih atas konfirmasi kehadiran Anda!",
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

  const formHeader = (
    <CardHeader>
        <CardTitle className="font-headline text-2xl">Konfirmasi Kehadiran</CardTitle>
        <CardDescription>Mohon konfirmasi kehadiran Anda untuk membantu kami dalam persiapan.</CardDescription>
    </CardHeader>
  );

  const successContent = (
      <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <p className="font-medium text-foreground">Terima kasih atas konfirmasi Anda!</p>
      </CardContent>
  );

  const loadingContent = (
      <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <p className="font-medium text-foreground">Memeriksa status...</p>
      </CardContent>
  );
  
  const renderContent = () => {
    if (isLoadingExistingRsvp) {
        return loadingContent;
    }
    if (isSubmitted) {
        return successContent;
    }
    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <RsvpFormContent ref={formContentRef} rsvpCollectionName={rsvpCollectionName} guestName={guestName} />
        </form>
    );
  }


  if (isCard) {
    return (
       <>
        <SectionTitle>RSVP</SectionTitle>
        <Card className="max-w-lg mx-auto shadow-lg border-accent/50">
          {formHeader}
          {renderContent()}
        </Card>
      </>
    );
  }

  // Not isCard (used in Tabs)
  return (
    <>
      {formHeader}
      {renderContent()}
    </>
  );
}
