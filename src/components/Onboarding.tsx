import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const [obStep, setObStep] = useState(0);
  const [gradeType, setGradeType] = useState('');
  const [gradeSection, setGradeSection] = useState('type');
  const navigate = useNavigate();

  const handleStart = () => setObStep(0); // If there was a welcome

  const saveAndNext = (key: string, val: string) => {
    const ob = JSON.parse(localStorage.getItem('eduApp_onboarding') || '{}');
    ob[key] = val;
    localStorage.setItem('eduApp_onboarding', JSON.stringify(ob));
  };

  const handleCourse = (course: string) => {
    saveAndNext('course', course);
    setObStep(1);
    setGradeSection('type');
  };

  const handleGradeType = (type: string) => {
    setGradeType(type);
    saveAndNext('gradeType', type);
    setGradeSection(type.toLowerCase());
  };

  const handleGrade = (grade: string) => {
    saveAndNext('grade', grade);
    setGradeSection('level');
  };

  const handleLevel = (level: string) => {
    saveAndNext('level', level);
    setObStep(2);
  };

  const handleTime = (time: string) => {
    saveAndNext('time', time);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white text-[#3c3c3c] flex flex-col items-center p-4">
      <div className="w-full max-w-md my-auto">
        {/* Progress */}
        <div className="flex gap-2 justify-center pt-5 pb-5">
          <div className={`w-3 h-3 rounded-full transition-colors ${obStep === 0 ? 'bg-[#1cb0f6]' : obStep > 0 ? 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${obStep === 1 ? 'bg-[#1cb0f6]' : obStep > 1 ? 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
          <div className={`w-3 h-3 rounded-full transition-colors ${obStep === 2 ? 'bg-[#1cb0f6]' : obStep > 2 ? 'bg-[#58cc02]' : 'bg-[#e5e5e5]'}`} />
        </div>

        {obStep === 0 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mt-6 mb-2">¿Qué deseas aprender?</h2>
            <p className="text-[#afafaf] text-[15px] mb-5">Elige un curso para comenzar</p>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button onClick={() => handleCourse('math')} className="p-8 pb-4 text-[#fff] font-bold text-sm leading-tight rounded-2xl bg-[var(--math)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--math-s)'}}>
                <span className="text-4xl block mb-4">📐</span>Matemáticas
              </button>
              <button onClick={() => handleCourse('comm')} className="p-8 pb-4 text-[#5a3e00] font-bold text-sm leading-tight rounded-2xl bg-[var(--comm)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--comm-s)'}}>
                <span className="text-4xl block mb-4">📖</span>Comunicación
              </button>
              <button onClick={() => handleCourse('social')} className="p-8 pb-4 text-[#fff] font-bold text-sm leading-tight rounded-2xl bg-[var(--social)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--social-s)'}}>
                <span className="text-4xl block mb-4">🌍</span>Ciencias Sociales
              </button>
              <button onClick={() => handleCourse('science')} className="p-8 pb-4 text-[#fff] font-bold text-sm leading-tight rounded-2xl bg-[var(--science)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--science-s)'}}>
                <span className="text-4xl block mb-4">🔬</span>Ciencia y Tecnología
              </button>
            </div>
          </div>
        )}

        {obStep === 1 && (
          <div className="text-center animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold mt-6 mb-2">
              {gradeSection === 'type' ? '¿En qué nivel estás?' : 
               gradeSection === 'level' ? '¿Cuál es tu nivel?' : 
               `¿Qué grado de ${gradeType}?`}
            </h2>
            <p className="text-[#afafaf] text-[15px] mb-5">
              {gradeSection === 'type' ? 'Elige tu nivel educativo' : 
               gradeSection === 'level' ? 'Selecciona tu dificultad' : 
               'Selecciona tu grado'}
            </p>

            {gradeSection === 'type' && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button onClick={() => handleGradeType('Primaria')} className="p-7 text-white text-lg font-bold rounded-2xl bg-[#a560f5] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 #8040d0'}}>
                  <span className="text-2xl block mb-2">🏫</span>Primaria
                </button>
                <button onClick={() => handleGradeType('Secundaria')} className="p-7 text-white text-lg font-bold rounded-2xl bg-[#ff9600] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 #c87000'}}>
                  <span className="text-2xl block mb-2">🏛️</span>Secundaria
                </button>
              </div>
            )}

            {gradeSection === 'primaria' && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                {['1ero','2do','3ero','4to','5to','6to'].map((g) => (
                  <button key={g} onClick={() => handleGrade(`${g} Primaria`)} className="p-4 text-white text-sm font-bold rounded-2xl bg-[var(--math)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--math-s)'}}>
                    {g}<br/>Primaria
                  </button>
                ))}
              </div>
            )}

            {gradeSection === 'secundaria' && (
              <div className="grid grid-cols-2 gap-3 mt-5">
                {['1ero','2do','3ero','4to','5to'].map((g) => (
                  <button key={g} onClick={() => handleGrade(`${g} Secundaria`)} className="p-4 text-white text-sm font-bold rounded-2xl bg-[var(--math)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--math-s)'}}>
                    {g}<br/>Secundaria
                  </button>
                ))}
              </div>
            )}

            {gradeSection === 'level' && (
              <div className="flex flex-col gap-3 mt-5">
                <button onClick={() => handleLevel('Principiante')} className="p-4 text-white font-bold rounded-2xl bg-[var(--science)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--science-s)'}}>
                  🌱 Principiante
                </button>
                <button onClick={() => handleLevel('Intermedio')} className="p-4 text-white font-bold rounded-2xl bg-[#ff9600] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 #c87000'}}>
                  ⚡ Intermedio
                </button>
                <button onClick={() => handleLevel('Avanzado')} className="p-4 text-white font-bold rounded-2xl bg-[var(--social)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--social-s)'}}>
                  🔥 Avanzado
                </button>
              </div>
            )}
          </div>
        )}

        {obStep === 2 && (
          <div className="text-center animate-in fade-in slide-in-from-right-4">
             <h2 className="text-2xl font-bold mt-6 mb-2">¿Cuánto tiempo al día?</h2>
             <p className="text-[#afafaf] text-[15px] mb-5">Elige cuánto tiempo dedicarás a AprendePe</p>
             <div className="flex flex-col gap-3 mt-5">
                {['5 minutos', '10 minutos', '15 minutos', '30 minutos'].map(t => (
                  <button key={t} onClick={() => handleTime(t)} className="p-4 text-white text-base font-bold rounded-2xl bg-[var(--math)] hover:scale-105 active:translate-y-1 transition-all" style={{boxShadow: '0 4px 0 var(--math-s)'}}>
                    ⏱️ {t}
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
