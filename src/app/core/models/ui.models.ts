export interface Workspace { id: string; title: string; description: string; icon: string; color: string; count: number; }
export interface Subject { id: string; title: string; code: string; progress: number; next: string; color: string; }
export interface DocumentItem { id: string; title: string; type: 'PDF' | 'DOCX' | 'PPTX'; meta: string; subject: string; color: string; }
export interface TaskItem { id: string; title: string; subject: string; due: string; priority: 'Alta' | 'Media' | 'Baja'; done?: boolean; }
export interface QuizItem { id: string; title: string; questions: number; score?: number; status: string; }
export interface ChatMessage { role: 'user' | 'assistant'; text: string; }
