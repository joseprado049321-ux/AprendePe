import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { UserProfile } from '../../types';

export default function Register() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleRegister = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);
      
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
          level: 'Inicial',
          lives: 5,
          perfectLessonsStreak: 0,
          wallet: { oro: 50, esmeralda: 0 },
          inventory: { streakProtectors: 0, xpMultipliers: 0 }
        };
        await setDoc(userRef, userProfile);
      }
      // Clean up guest profile if it exists
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestProfile');
      // Wait for onAuthStateChanged to pick up the app loading
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        const provider = new GoogleAuthProvider();
        signInWithRedirect(auth, provider);
      } else {
        setError('Error al registrar con Google.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-xl dark:shadow-2xl flex flex-col items-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center">Crear cuenta</h2>
        {error && <p className="text-rose-500 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-sm mb-6 w-full text-center font-medium">{error}</p>}
        
        <p className="text-slate-600 dark:text-slate-400 text-center mb-8">
          Regístrate usando tu cuenta de Google de forma segura.
        </p>

        <button 
          onClick={handleGoogleRegister} 
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
          Registrarse con Google
        </button>
      </div>
    </div>
  );
}
