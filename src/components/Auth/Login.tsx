import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { UserProfile } from '../../types';

interface LoginProps {
  setIsGuest?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Login({ setIsGuest }: LoginProps) {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getTempOnboarding = () => {
    const temp = localStorage.getItem('temp_onboarding');
    if (temp) {
      try {
        return JSON.parse(temp);
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null;
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists, if not create profile
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);
      
      const onboardingData = getTempOnboarding();

      if (!docSnap.exists()) {
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Usuario',
          streak: 0,
          lastActive: new Date().toISOString(),
          points: 0,
          xp: 0,
          unlockedAchievements: [],
          history: [],
          level: onboardingData?.level || 'Inicial',
          lives: 5,
          perfectLessonsStreak: 0,
          ...(onboardingData || {}),
          hasCompletedDiagnostic: !!onboardingData,
        };
        await setDoc(userRef, userProfile);
      } else if (onboardingData) {
        // If user exists but just did onboarding, update their profile
        await setDoc(userRef, { ...onboardingData, hasCompletedDiagnostic: true }, { merge: true });
      }

      if (onboardingData) {
        localStorage.removeItem('temp_onboarding');
      }
      
      // Clean up guest profile if it exists to avoid conflicts
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestProfile');
      if (setIsGuest) setIsGuest(false);
      
      // Let onAuthStateChanged handle navigation
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        const provider = new GoogleAuthProvider();
        signInWithRedirect(auth, provider);
      } else {
        setError('Error al iniciar sesión con Google.');
      }
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('isGuest', 'true');
    const onboardingData = getTempOnboarding();
    
    if (onboardingData) {
      const guestProfile: UserProfile = {
        uid: 'guest',
        email: '',
        displayName: 'Invitado',
        streak: 0,
        lastActive: new Date().toISOString(),
        points: 0,
        xp: 0,
        unlockedAchievements: [],
        history: [],
        level: onboardingData.level || 'Inicial',
        lives: 5,
        perfectLessonsStreak: 0,
        wallet: { oro: 50, esmeralda: 0 },
        inventory: { streakProtectors: 0, xpMultipliers: 0 },
        ...onboardingData,
        hasCompletedDiagnostic: true
      };
      localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
      localStorage.removeItem('temp_onboarding');
    }

    if (setIsGuest) setIsGuest(true);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-xl dark:shadow-2xl flex flex-col items-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">Inicia sesión</h2>
        {error && <p className="text-rose-500 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-sm mb-6 w-full text-center font-medium">{error}</p>}
        
        <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
          Usa tu cuenta de Google para acceder fácil y rápido, o entra como invitado.
        </p>

        <div className="w-full space-y-4">
          <button 
            onClick={handleGoogleLogin} 
            className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Continuar con Google
          </button>

          <button 
            onClick={handleGuestLogin} 
            className="w-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Continuar como invitado
          </button>
        </div>

        <p className="mt-8 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
          Al entrar como invitado, tus datos solo se guardarán temporalmente en este dispositivo.
        </p>
      </div>
    </div>
  );
}
