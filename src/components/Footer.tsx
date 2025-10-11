export function Footer({ coupleName }: { coupleName: string }) {
    return (
        <footer className="w-full bg-accent/30 mt-24 py-8">
            <div className="max-w-4xl mx-auto text-center text-foreground/60 px-6">
                <p className="font-headline text-2xl text-primary mb-2">{coupleName}</p>
                <p>Thank you for being part of our special day.</p>
                <p className="text-sm mt-4">&copy; {new Date().getFullYear()} Vell. All Rights Reserved.</p>
            </div>
        </footer>
    )
}