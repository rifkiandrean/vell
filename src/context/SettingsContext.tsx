
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { NotificationSettings } from '@/lib/types';

interface SettingsContextType {
    notificationSettings: NotificationSettings;
    playSound: () => void;
}

const defaultSettings: NotificationSettings = {
    soundEnabled: true,
    soundUrl: '/notification.mp3',
    volume: 0.5,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultSettings);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "settings", "notifications"), (docSnap) => {
            if (docSnap.exists()) {
                setNotificationSettings(docSnap.data() as NotificationSettings);
            }
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        // Pre-load audio or change source when URL changes
        if (typeof window !== 'undefined') {
            if (audioRef.current) {
                audioRef.current.src = notificationSettings.soundUrl;
            } else {
                audioRef.current = new Audio(notificationSettings.soundUrl);
            }
            audioRef.current.volume = notificationSettings.volume;
        }
    }, [notificationSettings.soundUrl, notificationSettings.volume]);
    
    const playSound = useCallback(() => {
        if (notificationSettings.soundEnabled && audioRef.current) {
            // Stop and reset current playback before starting a new one
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // The play() method returns a Promise, which can be useful for handling play/pause interruptions.
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // This error can happen if the user interacts with the page before the audio is ready.
                    // We can safely ignore it in most cases for notification sounds.
                    console.info("Audio play interrupted:", error);
                });
            }
        }
    }, [notificationSettings.soundEnabled]);

    const value = {
        notificationSettings,
        playSound,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
