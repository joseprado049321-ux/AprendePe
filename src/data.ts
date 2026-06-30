import { Level, Subject, Question } from './types';

export const getQuestions = (level: Level, subject: Subject): Question[] => {
  // Datos falsos (mock data) simulando preguntas de diferentes niveles
  const mockQuiz: Record<Level, Question[]> = {
    Inicial: [
      {
        id: 'i1',
        text: '¿Cuánto es 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswerIndex: 1,
        explanation: '¡Muy bien! Si tienes 2 manzanas y te regalan 2 más, tienes 4 manzanas completas.',
        subject: 'Matemáticas'
      },
      {
        id: 'i2',
        text: '¿De qué color es usualmente el cielo de día?',
        options: ['Verde', 'Rojo', 'Azul', 'Amarillo'],
        correctAnswerIndex: 2,
        explanation: '¡Exacto! El cielo despejado de día se ve de color Azul.',
        subject: 'Ciencias'
      },
      {
        id: 'i3',
        text: '¿Qué animalito hace "Guau Guau"?',
        options: ['El Gato', 'El Perro', 'La Vaca', 'El Pato'],
        correctAnswerIndex: 1,
        explanation: '¡Genial! Los dulces perritos hacen "Guau Guau" para comunicarse.',
        subject: 'Historia' // assigned broadly
      },
       {
        id: 'i4',
        text: '¿Cuál de estas es una vocal?',
        options: ['B', 'P', 'A', 'M'],
        correctAnswerIndex: 2,
        explanation: 'La letra A es la primera vocal.',
        subject: 'Comunicación'
      }
    ],
    Primaria: [
       {
        id: 'p1',
        text: '¿Cuál es el resultado de la multiplicación 8 x 7?',
        options: ['54', '56', '62', '48'],
        correctAnswerIndex: 1,
        explanation: 'Ocho veces el número siete (o 8x7) es exactamente igual a 56.',
        subject: 'Matemáticas'
      },
      {
        id: 'p2',
        text: '¿Cuál es el planeta más grande de nuestro sistema solar?',
        options: ['Tierra', 'Marte', 'Júpiter', 'Saturno'],
        correctAnswerIndex: 2,
        explanation: 'Júpiter es el planeta más grande, es un enorme gigante gaseoso.',
        subject: 'Ciencias'
      },
       {
        id: 'p3',
        text: '¿Cuáles de estos son colores primarios?',
        options: ['Naranja, Verde, Morado', 'Rojo, Amarillo, Azul', 'Blanco y Negro', 'Rosa, Celeste, Lila'],
        correctAnswerIndex: 1,
        explanation: 'Los colores primarios (que no se pueden crear mezclando otros colores) son el Rojo, Amarillo y Azul.',
        subject: 'Historia'
      },
      {
        id: 'p4',
        text: 'Identifica el verbo en la oración: "El perro corre rápido"',
        options: ['El', 'perro', 'corre', 'rápido'],
        correctAnswerIndex: 2,
        explanation: 'Un verbo es la palabra que indica la acción. En este caso es "corre".',
        subject: 'Comunicación'
      }
    ],
    Secundaria: [
      {
        id: 's1',
        text: '¿Cuál es la fórmula molecular química del agua?',
        options: ['CO2', 'NaCl', 'H2O', 'O2'],
        correctAnswerIndex: 2,
        explanation: 'El agua está compuesta por un enlace de dos átomos de hidrógeno y uno de oxígeno (H₂O).',
        subject: 'Ciencias'
      },
      {
        id: 's2',
        text: '¿En qué año comenzó la Segunda Guerra Mundial?',
        options: ['1914', '1939', '1945', '1989'],
        correctAnswerIndex: 1,
        explanation: 'El conflicto armado inició oficialmente el 1 de septiembre de 1939 con la invasión a Polonia.',
        subject: 'Historia'
      },
       {
        id: 's3',
        text: 'Selecciona la derivada correcta de la función f(x) = x²',
        options: ['2x', 'x', 'x³/3', '2'],
        correctAnswerIndex: 0,
        explanation: 'Usando la regla de las potencias de las derivadas, d/dx (x^n) es igual a n*x^(n-1).',
        subject: 'Matemáticas'
      },
       {
        id: 's4',
        text: '¿Qué es un oxímoron?',
        options: ['Un tipo de poema', 'Una figura literaria que usa conceptos contradictorios', 'Un elemento del teatro', 'Un tiempo verbal'],
        correctAnswerIndex: 1,
        explanation: 'Un oxímoron es una figura retórica en la que se unen dos términos de sentido contrario, como "un silencio ensordecedor".',
        subject: 'Comunicación'
      }
    ]
  };

  const levelQuestions = mockQuiz[level];
  const filteredQuestions = levelQuestions.filter(q => q.subject === subject);
  
  // Si no hay preguntas para esa materia, retornar un default o las preguntas sin filtrar para seguir funcionando
  if (filteredQuestions.length === 0) {
     return [
      {
        id: 'empty',
        text: `No hay preguntas disponibles de ${subject} para nivel ${level}.`,
        options: ['1', '2', '3', '4'],
        correctAnswerIndex: 0,
        explanation: 'Selecciona otra categoría.',
        subject: subject
      }
     ];
  }

  return filteredQuestions;
};
