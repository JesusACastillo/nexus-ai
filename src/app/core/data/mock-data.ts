import { ChatMessage, DocumentItem, QuizItem, Subject, TaskItem, Workspace } from '../models/ui.models';

export const WORKSPACES: Workspace[] = [
  { id: 'university', title: 'Universidad', description: 'Materias, apuntes y exámenes', icon: 'school-outline', color: '#7a5cff', count: 6 },
  { id: 'personal', title: 'Proyectos personales', description: 'Ideas, código y documentación', icon: 'code-slash-outline', color: '#25d7ff', count: 4 },
  { id: 'nexus', title: 'Nexus AI 2026', description: 'Producto, diseño y roadmap', icon: 'sparkles-outline', color: '#22e6a8', count: 8 },
];

export const SUBJECTS: Subject[] = [
  { id: 'ai', title: 'Inteligencia Artificial', code: 'IA-402', progress: 72, next: 'Examen · 14 jul', color: '#7a5cff' },
  { id: 'networks', title: 'Redes y Telecomunicaciones', code: 'RT-310', progress: 48, next: 'Proyecto · 18 jul', color: '#25d7ff' },
  { id: 'data', title: 'Base de Datos Avanzada', code: 'BD-305', progress: 84, next: 'Entrega · 21 jul', color: '#22e6a8' },
  { id: 'programming', title: 'Programación Concurrente', code: 'PC-210', progress: 35, next: 'Quiz · 23 jul', color: '#ffbd59' },
];

export const DOCUMENTS: DocumentItem[] = [
  { id: 'subnetting', title: 'Guía de subnetting.pdf', type: 'PDF', meta: '24 páginas · hace 2 h', subject: 'Redes', color: '#25d7ff' },
  { id: 'neural', title: 'Arquitecturas neuronales.docx', type: 'DOCX', meta: '1.8 MB · ayer', subject: 'IA', color: '#7a5cff' },
  { id: 'database', title: 'Diagrama_ER_Final.pptx', type: 'PPTX', meta: '12 diapositivas · 3 días', subject: 'Base de Datos', color: '#22e6a8' },
  { id: 'processes', title: 'Procesos concurrentes.pdf', type: 'PDF', meta: '38 páginas · 5 días', subject: 'Programación', color: '#ffbd59' },
];

export const TASKS: TaskItem[] = [
  { id: 't1', title: 'Completar práctica de subnetting', subject: 'Redes', due: 'Hoy · 18:00', priority: 'Alta' },
  { id: 't2', title: 'Repasar modelos de aprendizaje', subject: 'Inteligencia Artificial', due: 'Mañana · 10:00', priority: 'Media' },
  { id: 't3', title: 'Entregar diagrama entidad-relación', subject: 'Base de Datos', due: 'Vie · 23:59', priority: 'Alta' },
  { id: 't4', title: 'Leer capítulo de concurrencia', subject: 'Programación', due: 'Lun · 09:00', priority: 'Baja', done: true },
];

export const QUIZZES: QuizItem[] = [
  { id: 'q1', title: 'Subnetting esencial', questions: 10, score: 90, status: 'Completado' },
  { id: 'q2', title: 'Modelos de IA', questions: 15, status: 'Pendiente' },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { role: 'assistant', text: '¡Hola, Jesús! Soy Nexus. Puedo ayudarte a entender tus documentos, preparar un examen o convertir tus apuntes en un plan claro.' },
  { role: 'user', text: 'Explícame subnetting como si fuera la primera vez que lo estudio.' },
  { role: 'assistant', text: 'Imagina una red como un edificio. La máscara de subred decide cuántos pisos y departamentos tendrá. Dividirla permite organizar equipos y usar mejor las direcciones IP.' },
];
