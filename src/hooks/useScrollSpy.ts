
'use client';

import { useState, useEffect, useRef } from 'react';

interface ScrollSpyOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
}

export function useScrollSpy(
  sectionIds: string[],
  options?: ScrollSpyOptions
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = sectionIds.map(id => document.getElementById(id));
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        let bestVisibleRatio = 0;
        let bestEntry: IntersectionObserverEntry | null = null;
        
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > bestVisibleRatio) {
            bestVisibleRatio = entry.intersectionRatio;
            bestEntry = entry;
          }
        });

        if (bestEntry && bestVisibleRatio > (options?.threshold || 0.1)) {
           setActiveId(bestEntry.target.id);
        }
      },
      {
        root: options?.root,
        rootMargin: options?.rootMargin || '-50% 0px -50% 0px',
        threshold: options?.threshold ? [0, options.threshold, 1] : [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    elements.forEach(el => {
      if (el) {
        observer.current?.observe(el);
      }
    });

    return () => observer.current?.disconnect();
  }, [sectionIds, options]);

  return activeId;
}
