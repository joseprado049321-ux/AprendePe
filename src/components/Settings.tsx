import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Volume2, VolumeX, Bell, BellOff, Shield, Trash2, LogOut, Lock, Mail, AlertTriangle, KeyRound, Unlock, Sparkles } from 'lucide-react';
import { UserProfile, Level } from '../types';
import { useSound } from '../contexts/SoundContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { auth, db } from '../lib/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

interface SettingsProps {
  profile: UserProfile;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  isGuest?: boolean;
  linkGuestToGoogle?: () => void;
  handleLogout: () => void;
}

export default function Settings({ profile, updateProfile, isGuest, linkGuestToGoogle, handleLogout }: SettingsProps) {
  const navigate = useNavigate();
  const { isMuted, toggleMute, playSound } = useSound();
  const { theme, toggleTheme } = useTheme();
  const { requestPermission, permissionStatus } = useNotifications();

  // Local state for PIN modales
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingAction, setPendingAction] = useState<'changeLevel' | 'deleteAccount' | 'parentalPanel' | null>(null);
  
  // Parental Panel state
  const [parentalPanelOpen, setParentalPanelOpen] = useState(false);
  
  // Setup new PIN state
  const [setupPinModalOpen, setSetupPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');

  const handleThemeToggle = () => {
    playSound('click');
    toggleTheme();
  };

  const toggleNotifications = async () => {
    playSound('click');
    if (!profile.notificationsEnabled) {
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (granted && updateProfile) {
          updateProfile({ notificationsEnabled: true, dailyReminderTime: profile.dailyReminderTime || '18:00' });
        }
      } else if (updateProfile) {
        updateProfile({ notificationsEnabled: true, dailyReminderTime: profile.dailyReminderTime || '18:00' });
      }
    } else {
      if (updateProfile) {
        updateProfile({ notificationsEnabled: false });
      }
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (updateProfile) {
      updateProfile({ dailyReminderTime: e.target.value });
    }
  };

  // --- Protected Actions ---
  const requestProtectedAction = (action: 'changeLevel' | 'deleteAccount' | 'parentalPanel') => {
    playSound('click');
    if (profile.parentalPin) {
      setPendingAction(action);
      setPinInput('');
      setPinError('');
      setPinModalOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: 'changeLevel' | 'deleteAccount' | 'parentalPanel') => {
    if (action === 'parentalPanel') {
      setParentalPanelOpen(true);
    } else if (action === 'deleteAccount') {
       handleDeleteAccount();
    }
  };

  const submitPin = () => {
    if (pinInput === profile.parentalPin) {
      playSound('success');
      setPinModalOpen(false);
      if (pendingAction) executeAction(pendingAction);
    } else {
      playSound('fail');
      setPinError('PIN incorrecto');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Perderás todo tu progreso.")) {
       try {
         const user = auth.currentUser;
         if (user) {
           await deleteDoc(doc(db, 'users', user.uid));
           await deleteUser(user);
         }
         handleLogout();
       } catch (error) {
         console.error("Error al eliminar cuenta:", error);
         alert("Hubo un error al eliminar tu cuenta. Es posible que necesites iniciar sesión nuevamente antes de hacerlo.");
       }
    }
  };

  // Dedicated function for protected level change
  const [requestedLevel, setRequestedLevel] = useState<Level | null>(null);
  
  const handleLevelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = e.target.value as Level;
    if (newLevel === profile.educationalStage) return;
    
    if (profile.parentalPin) {
      setRequestedLevel(newLevel);
      setPinInput('');
      setPinError('');
      setPinModalOpen(true);
    } else {
      applyLevelChange(newLevel);
    }
  };

  const applyLevelChange = async (newLevel: Level) => {
    if (window.confirm(`Al cambiar a ${newLevel}, se borrará tu historial de lecciones para adaptar la IA a tu nuevo nivel. Tu XP y Gemas se mantendrán. ¿Continuar?`)) {
      if (updateProfile) {
        await updateProfile({
          educationalStage: newLevel,
          level: newLevel,
          history: [], 
          diagnosticScore: 0,
          hasCompletedDiagnostic: false 
        });
        playSound('levelUp');
        alert("Nivel cambiado exitosamente. Se requerirá una nueva prueba diagnóstica.");
      }
    }
  };

  // Override submit pin for Level change specifically if requestedLevel is set
  const onPinSubmit = () => {
    if (pinInput === profile.parentalPin) {
      playSound('success');
      setPinModalOpen(false);
      if (requestedLevel) {
        applyLevelChange(requestedLevel);
        setRequestedLevel(null);
      } else if (pendingAction) {
        executeAction(pendingAction);
      }
    } else {
      playSound('fail');
      setPinError('PIN incorrecto');
    }
  };

  const saveNewPin = async () => {
    if (newPin.length === 4) {
      if (updateProfile) {
        await updateProfile({ parentalPin: newPin });
        playSound('success');
        setSetupPinModalOpen(false);
        setNewPin('');
        alert("PIN configurado exitosamente.");
      }
    }
  };

  const removePin = async () => {
    if (window.confirm("¿Seguro que deseas desactivar el Control Parental?")) {
      if (updateProfile) {
        await updateProfile({ parentalPin: '', parentalEmail: '' });
        setParentalPanelOpen(false);
        playSound('click');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24 transition-colors">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-40 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Configuración</h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-8 mt-6">
        
        {/* Preferencias */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Preferencias</h2>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Nivel Educativo</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Adapta la IA a tu nivel actual.</p>
              </div>
              <div className="relative">
                <select 
                  value={profile.educationalStage || 'Primaria'}
                  onChange={handleLevelSelect}
                  className="appearance-none bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer w-full sm:w-auto font-medium"
                >
                  <option value="Inicial">Educación Inicial</option>
                  <option value="Primaria">Educación Primaria</option>
                  <option value="Secundaria">Educación Secundaria</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  {profile.parentalPin ? <Lock size={16} /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Materia Favorita</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Materia por defecto al abrir la app.</p>
              </div>
              <select 
                  value={profile.lastSelectedCourse || 'Matemáticas'}
                  onChange={(e) => updateProfile && updateProfile({ lastSelectedCourse: e.target.value })}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
              >
                  <option value="Matemáticas">Matemáticas</option>
                  <option value="Comunicación">Comunicación</option>
                  <option value="Ciencias">Ciencias</option>
                  <option value="Historia">Historia</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white flex items-center gap-2"><Sparkles className="text-amber-500" size={18} /> Tutor Pedagógico IA</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza la personalidad de tu guía.</p>
              </div>
              <select 
                  value={profile.tutor || 'Buhito (Sabio)'}
                  onChange={(e) => updateProfile && updateProfile({ tutor: e.target.value })}
                  disabled={profile.uid === 'guest'}
                  title={profile.uid === 'guest' ? 'Crea una cuenta para desbloquear más tutores' : ''}
                  className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                  <option value="Buhito (Sabio)">🦉 Buhito (Sabio)</option>
                  {profile.uid !== 'guest' && (
                    <>
                      <option value="Zorro (Astuto)">🦊 Zorro (Astuto)</option>
                      <option value="Llama (Paciente)">🦙 Llama (Paciente)</option>
                      <option value="Mono (Divertido) - Pro" disabled>🐒 Mono (Pro)</option>
                    </>
                  )}
              </select>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Mostrar Competencias CNEB</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ver los temas oficiales del currículo en el mapa.</p>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); updateProfile && updateProfile({ showCNEBCompetencies: !profile.showCNEBCompetencies }); }}
                className={`w-14 h-8 flex items-center shrink-0 rounded-full p-1 transition-colors duration-300 ${profile.showCNEBCompetencies ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${profile.showCNEBCompetencies ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Ajustes */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Ajustes</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Modo Oscuro</h3>
                </div>
              </div>
              <button 
                onClick={handleThemeToggle}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Efectos de Sonido</h3>
                </div>
              </div>
              <button 
                onClick={() => { playSound('click'); toggleMute(); }}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${!isMuted ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${!isMuted ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                   {profile.notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">Recordatorio Diario</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recibe notificaciones para estudiar.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {profile.notificationsEnabled && (
                  <input
                    type="time"
                    value={profile.dailyReminderTime || '18:00'}
                    onChange={handleTimeChange}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                <button 
                  onClick={toggleNotifications}
                  className={`w-14 h-8 flex items-center shrink-0 rounded-full p-1 transition-colors duration-300 ${profile.notificationsEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${profile.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Control Parental */}
        <section className="bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl p-6 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-800/50 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Control Parental / Tutor</h2>
              <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80">Protege configuraciones clave de la cuenta.</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-indigo-100/50 dark:border-indigo-800/20">
            <div className="flex items-center gap-3">
              <KeyRound size={20} className={profile.parentalPin ? "text-emerald-500" : "text-slate-400"} />
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {profile.parentalPin ? "Control Parental Activado" : "Control Parental Desactivado"}
              </span>
            </div>
            <button 
              onClick={() => profile.parentalPin ? requestProtectedAction('parentalPanel') : setSetupPinModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-colors"
            >
              {profile.parentalPin ? "Configurar" : "Activar PIN"}
            </button>
          </div>
        </section>

        {/* Cuenta y Seguridad */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/20">
          <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-200">Cuenta y Seguridad</h2>
          
          <div className="space-y-4">
            {isGuest && (
              <button 
                onClick={linkGuestToGoogle}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Vincular con Google</span>
                    <span className="text-xs text-slate-500">Guarda tu progreso permanentemente.</span>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-slate-400" />
              </button>
            )}

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <LogOut size={20} />
                <span className="font-medium">Cerrar Sesión</span>
              </div>
            </button>
            
            <button 
              onClick={() => requestProtectedAction('deleteAccount')}
              className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-2xl transition-colors text-left"
            >
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <Trash2 size={20} />
                <span className="font-bold">Eliminar Cuenta</span>
              </div>
              {profile.parentalPin && <Lock size={16} className="text-rose-400" />}
            </button>
          </div>
        </section>
      </div>

      {/* PIN Verification Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-indigo-600 dark:text-indigo-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Ingresa el PIN</h3>
              <p className="text-sm text-slate-500 mt-2">Esta acción está protegida por el Control Parental.</p>
            </div>
            
            <input 
              type="password" 
              maxLength={4}
              pattern="\d*"
              inputMode="numeric"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-widest p-4 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none mb-2 font-bold text-slate-800 dark:text-white"
            />
            {pinError && <p className="text-rose-500 text-sm text-center mb-4">{pinError}</p>}
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setPinModalOpen(false);
                  setRequestedLevel(null);
                  setPendingAction(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={onPinSubmit}
                disabled={pinInput.length !== 4}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup PIN Modal */}
      {setupPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-emerald-600 dark:text-emerald-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Crear PIN Parental</h3>
              <p className="text-sm text-slate-500 mt-2">Ingresa 4 dígitos numéricos que solo tú (Tutor) debas conocer.</p>
            </div>
            
            <input 
              type="password" 
              maxLength={4}
              pattern="\d*"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-widest p-4 bg-slate-100 dark:bg-slate-700 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none font-bold text-slate-800 dark:text-white"
            />
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setSetupPinModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveNewPin}
                disabled={newPin.length !== 4}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                Guardar PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parental Settings Panel */}
      {parentalPanelOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="text-indigo-500" size={24} /> Panel Parental
              </h3>
              <button onClick={() => setParentalPanelOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:text-slate-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Correo para Reportes</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={profile.parentalEmail || ''}
                      onChange={(e) => updateProfile && updateProfile({ parentalEmail: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Recibirás resúmenes automáticos del progreso del alumno. (Próximamente)</p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={removePin}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-colors"
                >
                  <Unlock size={20} /> Desactivar Control Parental
                </button>
                <p className="text-xs text-center text-slate-400 mt-3">Al desactivarlo, se borrará el PIN y el alumno podrá cambiar su nivel o eliminar su cuenta libremente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
