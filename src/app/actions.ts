'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, orderBy, query, Timestamp, Firestore } from 'firebase/firestore';
import type { Rsvp, GuestbookMessage } from '@/types';
import { addDocumentNonBlocking } from '@/firebase';


// --- RSVP FORM ACTION ---
const RsvpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  attending: z.enum(['yes', 'no'], { required_error: 'Please select your attendance status.' }),
});

export async function submitRsvp(prevState: any, formData: FormData) {
  const validatedFields = RsvpSchema.safeParse({
    name: formData.get('name'),
    attending: formData.get('attending'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors below.',
    };
  }

  const rsvpData = validatedFields.data;

  try {
    // Firestore is handled on the client-side now. This action is no longer used for writing data.
    revalidatePath('/undangan');
    return { message: 'Thank you for your RSVP!', errors: {} };
  } catch (e) {
    console.error('Error revalidating path: ', e);
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}

// --- GUESTBOOK FORM ACTION ---
const GuestbookSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  message: z.string().min(5, { message: 'Message must be at least 5 characters.' }).max(500, { message: 'Message cannot exceed 500 characters.' }),
});

export async function submitGuestbookMessage(prevState: any, formData: FormData) {
  const validatedFields = GuestbookSchema.safeParse({
    name: formData.get('name'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors below.',
    };
  }
  
  const guestbookData = validatedFields.data;

  try {
     // Firestore is handled on the client-side now. This action is no longer used for writing data.
    revalidatePath('/undangan');
    return { message: 'Your message has been posted!', errors: {} };
  } catch (e) {
    console.error('Error revalidating path: ', e);
    return { message: 'An unexpected error occurred. Please try again.', errors: {} };
  }
}
