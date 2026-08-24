import { Biome, Subject } from '../types';

export const curriculumMap: Record<Subject, Biome[]> = {
  Matemáticas: [
    {
      id: 'math_biome_1',
      name: 'Isla de los Números',
      bgGradient: 'from-emerald-300 via-teal-400 to-emerald-500',
      pathColor: '#059669', // emerald-600
      subThemes: [
        {
          id: 'math_1',
          name: 'Conteo Básico',
          requiredXP: 100,
          cnebCompetence: 'Resuelve problemas de cantidad',
          promptTopic: 'Conteo del 1 al 20, reconocimiento de números básicos.'
        },
        {
          id: 'math_2',
          name: 'Suma Inicial',
          requiredXP: 250,
          cnebCompetence: 'Resuelve problemas de cantidad',
          promptTopic: 'Sumas básicas de un dígito, con apoyo visual.'
        },
        {
          id: 'math_3',
          name: 'Resta Inicial',
          requiredXP: 450,
          cnebCompetence: 'Resuelve problemas de cantidad',
          promptTopic: 'Restas básicas de un dígito.'
        }
      ]
    },
    {
      id: 'math_biome_2',
      name: 'Volcán Aritmético',
      bgGradient: 'from-orange-400 via-rose-500 to-red-600',
      pathColor: '#be123c', // rose-700
      subThemes: [
        {
          id: 'math_4',
          name: 'Sumas de 2 Cifras',
          requiredXP: 700,
          cnebCompetence: 'Resuelve problemas de cantidad',
          promptTopic: 'Sumas de dos cifras sin llevar y llevando.'
        },
        {
          id: 'math_5',
          name: 'Restas de 2 Cifras',
          requiredXP: 1000,
          cnebCompetence: 'Resuelve problemas de cantidad',
          promptTopic: 'Restas de dos cifras prestando.'
        },
        {
          id: 'math_6',
          name: 'Patrones Simples',
          requiredXP: 1350,
          cnebCompetence: 'Resuelve problemas de regularidad, equivalencia y cambio',
          promptTopic: 'Continuar secuencias numéricas y patrones geométricos simples.'
        }
      ]
    }
  ],
  Comunicación: [
    {
      id: 'comm_biome_1',
      name: 'Bosque de las Letras',
      bgGradient: 'from-amber-200 via-yellow-400 to-orange-400',
      pathColor: '#b45309',
      subThemes: [
        {
          id: 'comm_1',
          name: 'Vocales y Sílabas',
          requiredXP: 100,
          cnebCompetence: 'Se comunica oralmente en su lengua materna',
          promptTopic: 'Reconocimiento de vocales, sonidos iniciales y formación de sílabas básicas.'
        },
        {
          id: 'comm_2',
          name: 'Palabras Comunes',
          requiredXP: 250,
          cnebCompetence: 'Lee diversos tipos de textos escritos',
          promptTopic: 'Reconocimiento de palabras cotidianas cortas.'
        }
      ]
    },
    {
      id: 'comm_biome_2',
      name: 'Valle de Cuentos',
      bgGradient: 'from-fuchsia-300 via-pink-400 to-rose-400',
      pathColor: '#be185d',
      subThemes: [
        {
          id: 'comm_3',
          name: 'Oraciones Simples',
          requiredXP: 450,
          cnebCompetence: 'Escribe diversos tipos de textos',
          promptTopic: 'Estructura sujeto-verbo en oraciones simples.'
        },
        {
          id: 'comm_4',
          name: 'Comprensión Lectora',
          requiredXP: 700,
          cnebCompetence: 'Lee diversos tipos de textos escritos',
          promptTopic: 'Leer pequeños párrafos y responder preguntas literales sobre ellos.'
        }
      ]
    }
  ],
  Ciencias: [
    {
      id: 'sci_biome_1',
      name: 'Laboratorio Selva',
      bgGradient: 'from-lime-300 via-green-400 to-emerald-600',
      pathColor: '#047857',
      subThemes: [
        {
          id: 'sci_1',
          name: 'Los Sentidos',
          requiredXP: 150,
          cnebCompetence: 'Explica el mundo físico basándose en conocimientos',
          promptTopic: 'Identificar los 5 sentidos y sus órganos principales.'
        },
        {
          id: 'sci_2',
          name: 'Animales y Hábitats',
          requiredXP: 400,
          cnebCompetence: 'Explica el mundo físico basándose en conocimientos',
          promptTopic: 'Clasificación de animales (mamíferos, aves, peces) y dónde viven.'
        }
      ]
    }
  ],
  Historia: [
    {
      id: 'hist_biome_1',
      name: 'Ruinas del Tiempo',
      bgGradient: 'from-stone-300 via-orange-200 to-yellow-600',
      pathColor: '#9a3412',
      subThemes: [
        {
          id: 'hist_1',
          name: 'Familia y Comunidad',
          requiredXP: 150,
          cnebCompetence: 'Construye interpretaciones históricas',
          promptTopic: 'Árbol genealógico, roles en la familia y la comunidad local.'
        },
        {
          id: 'hist_2',
          name: 'Culturas Preincas',
          requiredXP: 450,
          cnebCompetence: 'Construye interpretaciones históricas',
          promptTopic: 'Características básicas de Caral, Chavín, Paracas, Nazca, Mochica.'
        }
      ]
    }
  ],
  Variado: [
    {
      id: 'var_biome_1',
      name: 'Isla Desafío',
      bgGradient: 'from-cyan-400 via-blue-500 to-indigo-600',
      pathColor: '#1d4ed8',
      subThemes: [
        {
          id: 'var_1',
          name: 'Desafío Inicial',
          requiredXP: 200,
          cnebCompetence: 'Competencia Transversal',
          promptTopic: 'Preguntas mezcladas de matemáticas básicas y lenguaje.'
        },
        {
          id: 'var_2',
          name: 'Mente Ágil',
          requiredXP: 500,
          cnebCompetence: 'Competencia Transversal',
          promptTopic: 'Adivinanzas, problemas lógicos simples y cultura general básica.'
        }
      ]
    }
  ]
};
