import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'todos' },
  { path: 'todos', loadComponent: () => import('./features/todos/todos.page').then((m) => m.TodosPage) },
  { path: '**', redirectTo: 'todos' },
];
