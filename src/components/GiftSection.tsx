'use client';

import Image from 'next/image';
import { SectionTitle } from './SectionTitle';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, QrCode } from 'lucide-react';
import type { WeddingDetails } from '@/types';
import { getGoogleDriveFileUrl } from '@/lib/utils';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const GiftCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'rounded-xl shadow-lg p-6 flex flex-col justify-between min-h-[220px] text-primary-foreground relative overflow-hidden',
      className
    )}
  >
    {children}
  </div>
);

const CardLogo = ({ src, alt, className }: { src?: string | null; alt: string, className?: string }) => {
  if (!src) return null;
  return (
    <div className={cn("absolute top-4 right-6", className)}>
      <Image src={src} alt={alt} layout="fill" objectFit="contain" className="mix-blend-lighten" />
    </div>
  );
};

const CardNumber = ({
  number,
  onCopy,
}: {
  number?: string;
  onCopy: () => void;
}) => {
  if (!number) return null;
  // Add space every 4 digits
  const formattedNumber = number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  return (
    <div className="flex items-center gap-2">
      <p className="font-mono text-2xl tracking-widest text-primary-foreground/90">
        {formattedNumber}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCopy}
        className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20 h-8 w-8"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
};

const CardHolder = ({ name }: { name?: string }) => {
  if (!name) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-primary-foreground/60">
        Account Holder
      </p>
      <p className="font-semibold text-lg tracking-wide">{name}</p>
    </div>
  );
};

export function GiftSection({ details }: { details: WeddingDetails }) {
  const { toast } = useToast();
  const [showDana, setShowDana] = useState(false);
  
  const hasBca = details.bcaAccountNumber && details.bcaAccountName;
  const hasDana = details.danaNumber && details.danaName;

  const danaQrImageUrl = getGoogleDriveFileUrl(details.danaQrImageUrl);
  const bcaLogoUrl = 'https://drive.google.com/file/d/1bSNDmJ7tlmpujlFHNMcuiRf_08_mUcoQ/view?usp=drive_link';
  const danaLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg";


  const handleCopy = (text: string, accountName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Nomor Disalin!',
      description: `Nomor ${accountName} telah disalin.`,
    });
  };

  return (
    <>
      <SectionTitle>Kirim Hadiah</SectionTitle>
      <p className="text-center max-w-xl mx-auto -mt-8 mb-12 text-foreground/70">
        Doa restu Anda adalah hadiah terindah bagi kami. Namun, jika Anda ingin
        memberikan tanda kasih, kami dengan senang hati menerimanya.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {hasBca && (
          <GiftCard className="bg-gradient-to-br from-blue-900 to-blue-700">
             <CardLogo src={getGoogleDriveFileUrl(bcaLogoUrl)} alt="BCA Logo" className="w-28 h-14" />
            <div className="mt-16 space-y-1">
                 <p className="text-sm text-primary-foreground/80">Nomor Rekening</p>
                <CardNumber
                    number={details.bcaAccountNumber}
                    onCopy={() => handleCopy(details.bcaAccountNumber!, 'BCA')}
                />
            </div>
            <CardHolder name={details.bcaAccountName} />
          </GiftCard>
        )}
        
        {hasDana && (
          <GiftCard className="bg-gradient-to-br from-sky-600 to-sky-400">
             <CardLogo src={danaLogoUrl} alt="DANA Logo" className="w-20 h-10 brightness-0 invert" />
             <div className="mt-16 space-y-4">
                 <div className='space-y-1'>
                    <p className="text-sm text-primary-foreground/80">Nomor DANA</p>
                    <CardNumber
                        number={details.danaNumber}
                        onCopy={() => handleCopy(details.danaNumber!, 'DANA')}
                    />
                 </div>
                 {danaQrImageUrl && (
                      <div className="flex items-center">
                           <Button onClick={() => setShowDana(!showDana)} variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/20">
                                <QrCode className="mr-2 h-4 w-4" />
                                {showDana ? 'Sembunyikan' : 'Tampilkan'} QR Code
                           </Button>
                      </div>
                 )}
            </div>
             <CardHolder name={details.danaName} />
              {showDana && danaQrImageUrl && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 rounded-xl animate-in fade-in z-10">
                    <div className="relative w-48 h-48 bg-white p-2 rounded-lg">
                        <Image src={danaQrImageUrl} alt="DANA QR Code" layout="fill" objectFit="contain" />
                    </div>
                     <Button onClick={() => setShowDana(false)} variant="link" className="mt-4 text-white">Tutup</Button>
                </div>
            )}
          </GiftCard>
        )}
      </div>
    </>
  );
}
