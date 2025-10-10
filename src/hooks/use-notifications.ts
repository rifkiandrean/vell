
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser ini tidak mendukung notifikasi desktop.');
      return;
    }

    if (permission === 'granted') {
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);

    if (status === 'granted') {
      toast({
        title: 'Notifikasi Diizinkan!',
        description: 'Anda akan menerima notifikasi untuk pesanan baru.',
      });
    } else if (status === 'denied') {
      toast({
        variant: 'destructive',
        title: 'Notifikasi Diblokir',
        description: 'Anda memblokir notifikasi. Aktifkan melalui pengaturan browser jika ingin menerimanya.',
      });
    }
  }, [permission, toast]);

  const showNotification = useCallback((title: string, body: string, icon: string = '/favicon.ico') => {
    if (permission !== 'granted') {
      console.warn('Izin notifikasi belum diberikan.');
      return;
    }

    // Check if the page is visible. If so, don't show notification.
    if(document.visibilityState === 'visible') {
        return;
    }

    new Notification(title, {
      body,
      icon,
    });
  }, [permission]);

  return { requestPermission, showNotification, permission };
}
