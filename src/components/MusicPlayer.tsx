'use client';

import { Music, PauseCircle, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function MusicPlayer({ isPlaying, onToggle }: { isPlaying: boolean; onToggle: () => void }) {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full bg-primary/50 text-primary-foreground backdrop-blur-sm hover:bg-primary/70 transition-all"
      >
        {isPlaying ? (
          <Music className="w-6 h-6 animate-spin" style={{ animationDuration: '3s' }} />
        ) : (
          <Music className="w-6 h-6" />
        )}
        <span className="sr-only">{isPlaying ? 'Jeda Musik' : 'Putar Musik'}</span>
      </Button>
    </div>
  );
}
