import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface NotificationsContextType {
  requestPermission: () => Promise<boolean>;
  permissionStatus: NotificationPermission | 'unsupported';
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children, profile }: { children: React.ReactNode, profile: UserProfile | null }) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setPermissionStatus('unsupported');
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission === 'granted';
    } catch (error) {
      console.error("Error requesting notification permission", error);
      return false;
    }
  };

  useEffect(() => {
    if (!profile?.notificationsEnabled || !profile.dailyReminderTime || permissionStatus !== 'granted') return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      if (currentTime === profile.dailyReminderTime) {
        const lastNotified = localStorage.getItem('lastNotifiedDate');
        const today = now.toLocaleDateString();

        if (lastNotified !== today) {
          localStorage.setItem('lastNotifiedDate', today);
          try {
            new Notification('¡Es hora de aprender!', {
              body: 'Tu meta diaria te está esperando. ¡Continúa tu progreso en HAGS!',
              icon: '/vite.svg'
            });
          } catch (error) {
            console.error("Error showing notification:", error);
          }
        }
      }
    }, 60000); // Check every minute

    // Also check immediately in case the minute just rolled over
    return () => clearInterval(interval);
  }, [profile?.notificationsEnabled, profile?.dailyReminderTime, permissionStatus]);

  return (
    <NotificationsContext.Provider value={{ requestPermission, permissionStatus }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
