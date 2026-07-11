import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  /* ── Public routes (no guard or publicGuard) ──────────────────────────── */
  { path: 'splash', loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage) },
  { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage) },
  { path: 'login', canActivate: [publicGuard], loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage), data: { mode: 'login' } },
  { path: 'register', canActivate: [publicGuard], loadComponent: () => import('./pages/auth/auth.page').then(m => m.AuthPage), data: { mode: 'register' } },

  /* ── Protected routes (authGuard) ─────────────────────────────────────── */
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'workspaces', canActivate: [authGuard], loadComponent: () => import('./pages/workspaces/workspaces.page').then(m => m.WorkspacesPage) },
  { path: 'workspaces/:id', canActivate: [authGuard], loadComponent: () => import('./pages/workspace-detail/workspace-detail.page').then(m => m.WorkspaceDetailPage) },
  { path: 'subjects/:id', canActivate: [authGuard], loadComponent: () => import('./pages/subject-detail/subject-detail.page').then(m => m.SubjectDetailPage) },
  { path: 'library', canActivate: [authGuard], loadComponent: () => import('./pages/library/library.page').then(m => m.LibraryPage) },
  { path: 'upload', canActivate: [authGuard], loadComponent: () => import('./pages/upload/upload.page').then(m => m.UploadPage) },
  { path: 'documents/:id', canActivate: [authGuard], loadComponent: () => import('./pages/document-detail/document-detail.page').then(m => m.DocumentDetailPage) },
  { path: 'summary', canActivate: [authGuard], loadComponent: () => import('./pages/summary/summary.page').then(m => m.SummaryPage) },
  { path: 'chat', canActivate: [authGuard], loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage), data: { mode: 'general' } },
  { path: 'chat/document', canActivate: [authGuard], loadComponent: () => import('./pages/chat/chat.page').then(m => m.ChatPage), data: { mode: 'document' } },
  { path: 'quiz-generator', canActivate: [authGuard], loadComponent: () => import('./pages/quiz-generator/quiz-generator.page').then(m => m.QuizGeneratorPage) },
  { path: 'quiz', canActivate: [authGuard], loadComponent: () => import('./pages/quiz/quiz.page').then(m => m.QuizPage) },
  { path: 'quiz-result', canActivate: [authGuard], loadComponent: () => import('./pages/quiz-result/quiz-result.page').then(m => m.QuizResultPage) },
  { path: 'flashcards', canActivate: [authGuard], loadComponent: () => import('./pages/flashcards/flashcards.page').then(m => m.FlashcardsPage) },
  { path: 'tasks', canActivate: [authGuard], loadComponent: () => import('./pages/tasks/tasks.page').then(m => m.TasksPage) },
  { path: 'study-plan', canActivate: [authGuard], loadComponent: () => import('./pages/study-plan/study-plan.page').then(m => m.StudyPlanPage) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'settings', canActivate: [authGuard], loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage) },

  /* ── Defaults ─────────────────────────────────────────────────────────── */
  { path: '', redirectTo: 'splash', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
