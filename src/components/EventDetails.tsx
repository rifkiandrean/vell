import { Building, MapPin, CalendarDays, PartyPopper, Map } from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import type { WeddingDetails } from "@/types";
import { Button } from "./ui/button";

const DetailItem = ({ icon: Icon, title, date, time, location, address, googleMapsUrl }: { icon: React.ElementType, title?: string, date?: string, time?: string, location?: string, address?: string, googleMapsUrl?: string }) => {
    
    return (
    <div className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm bg-card/50">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary border-2 border-primary/50">
            <Icon className="h-8 w-8" />
        </div>
        <h3 className="font-headline text-3xl text-primary">{title}</h3>
        <div className="mt-4 text-foreground/80 space-y-2">
            <div className="flex items-center justify-center gap-2 font-bold">
                <CalendarDays className="h-4 w-4" />
                <span className="font-bold">{date}</span>
            </div>
            <p>{time}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
            </div>
            <p className="text-sm text-foreground/60">{address}</p>
        </div>
        {googleMapsUrl && (
            <div className="mt-6 w-full space-y-4">
                <div className="aspect-video w-full bg-accent/50 rounded-md flex items-center justify-center text-sm text-foreground/50 overflow-hidden">
                     <iframe
                        src={googleMapsUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
                {/* The "Lihat di Maps" button should link to a shareable URL, not the embed URL. 
                    Since we are only asking for the embed URL now, we can't easily construct a shareable one.
                    We will hide this button for now to avoid confusion. A future improvement could be to ask for both.
                */}
            </div>
        )}
    </div>
    )
};

export function EventDetails({ details }: { details: WeddingDetails }) {
    return (
        <>
            <SectionTitle>Save The Date</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <DetailItem 
                    icon={Building} 
                    title={details.akadTitle || "Akad Nikah"}
                    date={details.akadDate}
                    time={details.akadTime}
                    location={details.akadLocation}
                    address={details.akadAddress}
                    googleMapsUrl={details.akadGoogleMapsUrl}
                />
                <DetailItem 
                    icon={PartyPopper} 
                    title={details.resepsiTitle || "Resepsi"}
                    date={details.resepsiDate}
                    time={details.resepsiTime}
                    location={details.resepsiLocation}
                    address={details.resepsiAddress}
                    googleMapsUrl={details.resepsiGoogleMapsUrl}
                />
            </div>
        </>
    );
}
