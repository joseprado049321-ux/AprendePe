import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile, Level, Subject } from './types';

import Home from './components/Home';
import Quiz from './components/Quiz';
import Review from './components/Review';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Profile from './components/Profile';
import Shop from './components/Shop';
import Settings from './components/Settings';

import Diagnostic from './components/Diagnostic';

import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ThemeProvider } from './contexts/ThemeContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    
    if (isGuest) {
      const localStr = localStorage.getItem('guestProfile');
      if (localStr) {
        setProfile(JSON.parse(localStr));
      } else {
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
          level: 'Inicial',
          lives: 5,
          perfectLessonsStreak: 0,
          wallet: { oro: 50, esmeralda: 0 },
          inventory: { streakProtectors: 0, xpMultipliers: 0 }
        };
        localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
        setProfile(guestProfile);
      }
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
        }
      }
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [isGuest]);

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    
    if (isGuest) {
      localStorage.setItem('guestProfile', JSON.stringify(newProfile));
      setProfile(newProfile);
    } else if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), newProfile, { merge: true });
        // The onSnapshot will automatically update our state
      } catch (err) {
        console.error("Error updating profile in Firebase:", err);
      }
    }
  };

  const linkGuestToGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userRef = doc(db, 'users', result.user.uid);
      
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists() && profile) {
        const newProfile: UserProfile = {
          ...profile,
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Usuario',
          lives: profile.lives ?? 5,
          perfectLessonsStreak: profile.perfectLessonsStreak || 0,
          wallet: profile.wallet || { oro: 50, esmeralda: 0 },
          inventory: profile.inventory || { streakProtectors: 0, xpMultipliers: 0 }
        };
        await setDoc(userRef, newProfile);
      } else if (docSnap.exists() && profile) {
        // Fusionar el progreso del invitado con el perfil viejo
        const oldProfile = docSnap.data() as UserProfile;
        const newProfile: Partial<UserProfile> = {
          xp: (oldProfile.xp || 0) + (profile.xp || 0),
          points: (oldProfile.points || 0) + (profile.points || 0),
          streak: Math.max(oldProfile.streak || 0, profile.streak || 0),
          wallet: {
            oro: (oldProfile.wallet?.oro || 0) + (profile.wallet?.oro || 0),
            esmeralda: (oldProfile.wallet?.esmeralda || 0) + (profile.wallet?.esmeralda || 0)
          },
          inventory: {
            streakProtectors: (oldProfile.inventory?.streakProtectors || 0) + (profile.inventory?.streakProtectors || 0),
            xpMultipliers: (oldProfile.inventory?.xpMultipliers || 0) + (profile.inventory?.xpMultipliers || 0)
          }
        };
        await setDoc(userRef, newProfile, { merge: true });
      }
      
      setIsGuest(false);
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestProfile');
    } catch (err) {
      console.error("Error linking account:", err);
    }
  };

  const handleLogout = () => {
    if (isGuest) {
      setIsGuest(false);
      localStorage.removeItem('isGuest');
      localStorage.removeItem('guestProfile');
    } else {
      auth.signOut();
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const isAuthenticated = user !== null || isGuest;

  if (isAuthenticated && !profile) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const needsDiagnostic = isAuthenticated && profile && !profile.hasCompletedDiagnostic;

  const stageTheme = profile?.educationalStage ? `theme-${profile.educationalStage.toLowerCase()}` : '';

  return (
    <ThemeProvider initialTheme={profile?.theme} onThemeChange={(t) => handleUpdateProfile({ theme: t })}>
      <NotificationsProvider profile={profile}>
        <div className={`min-h-screen bg-[var(--bg,theme(colors.slate.50))] text-[var(--text,theme(colors.slate.900))] dark:bg-[var(--bg,theme(colors.slate.900))] dark:text-[var(--text,white)] transition-colors duration-300 ${stageTheme}`}>
          <Routes>
            <Route path="/" element={!isAuthenticated ? <Diagnostic /> : (needsDiagnostic ? <Diagnostic profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/home" />)} />
            <Route path="/login" element={!isAuthenticated ? <Login setIsGuest={setIsGuest} /> : (needsDiagnostic ? <Navigate to="/" /> : <Navigate to="/home" />)} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : (needsDiagnostic ? <Navigate to="/" /> : <Navigate to="/home" />)} />
            <Route path="/diagnostic" element={<Navigate to="/" replace />} />
            <Route path="/home" element={isAuthenticated && profile ? (!needsDiagnostic ? <Home profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/" />) : <Navigate to="/login" />} />
            <Route path="/shop" element={isAuthenticated && profile ? (!needsDiagnostic ? <Shop profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/" />) : <Navigate to="/login" />} />
            <Route path="/quiz" element={isAuthenticated && profile ? (!needsDiagnostic ? <Quiz profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/" />) : <Navigate to="/login" />} />
            <Route path="/review" element={isAuthenticated && profile ? (!needsDiagnostic ? <Review profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/" />) : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated && profile ? <Profile profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated && profile ? <Settings profile={profile} updateProfile={handleUpdateProfile} isGuest={isGuest} linkGuestToGoogle={linkGuestToGoogle} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={isAuthenticated && profile ? <Leaderboard currentUserId={profile.uid} /> : <Navigate to="/login" />} />
            <Route path="/achievements" element={isAuthenticated && profile ? <Achievements profile={profile} updateProfile={handleUpdateProfile} /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </NotificationsProvider>
    </ThemeProvider>
  );
}
