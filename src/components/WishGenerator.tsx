'use client';

import { useState } from 'react';
import { generateWeddingWish } from '@/ai/flows/generate-wedding-wish';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from './SectionTitle';
import { Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WishGenerator() {
  const [keywords, setKeywords] = useState('');
  const [generatedWish, setGeneratedWish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!keywords.trim()) {
        toast({
            title: "Kata kunci diperlukan",
            description: "Silakan masukkan beberapa kata kunci untuk menghasilkan ucapan.",
            variant: "destructive",
        });
      return;
    }
    setIsLoading(true);
    setGeneratedWish('');
    try {
      const result = await generateWeddingWish({ keywords });
      if(result.wish) {
        setGeneratedWish(result.wish);
      } else {
        throw new Error("Generated wish is empty.");
      }
    } catch (error) {
      console.error('Error generating wish:', error);
      toast({
          title: "Gagal Membuat Ucapan",
          description: "Tidak dapat membuat ucapan saat ini. Silakan coba lagi nanti.",
          variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SectionTitle>AI Wish Generator</SectionTitle>
      <Card className="max-w-lg mx-auto shadow-lg border-accent/50">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-primary" />
            Buat Ucapan Pribadi
          </CardTitle>
          <CardDescription>
            Bingung mau menulis apa? Masukkan beberapa kata kunci (misalnya, kebahagiaan, petualangan, cinta) dan biarkan AI kami membuatkan ucapan yang indah untuk Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="contoh: bahagia, perjalanan, selamanya"
            disabled={isLoading}
          />
          {generatedWish && (
            <Card className="bg-accent/50 border-primary/20">
                <CardContent className="p-4">
                    <blockquote className="italic text-foreground/80">{generatedWish}</blockquote>
                </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? 'Membuat...' : 'Buat Ucapan'}
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
