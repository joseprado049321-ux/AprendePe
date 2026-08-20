import { useState, useEffect } from 'react';
import { UserProfile } from '../types';

export const LIVES_RECHARGE_TIME_MS = 20 * 60 * 1000; // 20 minutos

export function useLives(profile: UserProfile | null, updateProfile?: (updates: Partial<UserProfile>) => void) {
  const [currentLives, setCurrentLives] = useState(profile?.lives ?? 5);
  const [timeUntilNext, setTimeUntilNext] = useState<number | null>(null);
  const [justGainedLife, setJustGainedLife] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const calculateLives = () => {
      let lives = profile.lives ?? 5;
      let hasGainedLifeThisCycle = false;
      
      if (lives < 5) {
        // Para usuarios antiguos sin livesUpdatedAt, asumimos que perdieron la vida justo ahora
        let lastUpdate = profile.livesUpdatedAt ? new Date(profile.livesUpdatedAt).getTime() : Date.now();
        const now = Date.now();
        const diff = now - lastUpdate;
        
        const livesRegained = Math.floor(diff / LIVES_RECHARGE_TIME_MS);
        
        if (livesRegained > 0) {
          lives = Math.min(5, lives + livesRegained);
          lastUpdate += livesRegained * LIVES_RECHARGE_TIME_MS;
          
          if (updateProfile) {
             updateProfile({ 
               lives, 
               livesUpdatedAt: lives < 5 ? new Date(lastUpdate).toISOString() : undefined 
             });
          }
          hasGainedLifeThisCycle = true;
        } else if (!profile.livesUpdatedAt && updateProfile) {
          // Inicializar livesUpdatedAt para usuarios antiguos que tienen menos de 5 vidas
          updateProfile({ livesUpdatedAt: new Date(now).toISOString() });
        }
        
        if (lives < 5) {
          const nextLifeTime = lastUpdate + LIVES_RECHARGE_TIME_MS;
          setTimeUntilNext(Math.max(0, nextLifeTime - now));
        } else {
          setTimeUntilNext(null);
        }
      } else {
        setTimeUntilNext(null);
      }
      
      setCurrentLives((prevLives) => {
        if (lives > prevLives || hasGainedLifeThisCycle) {
          setJustGainedLife(true);
          setTimeout(() => setJustGainedLife(false), 2000); // 2s de animación
        }
        return lives;
      });
    };

    calculateLives();
    const interval = setInterval(calculateLives, 1000);
    return () => clearInterval(interval);
  }, [profile, updateProfile]);

  return { currentLives, timeUntilNext, justGainedLife };
}
