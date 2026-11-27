import { Component, inject, signal } from '@angular/core';
import { TodoFilter, TodosStore } from './todos.store';

@Component({
  selector: 'app-todos-page',
  templateUrl: './todos.page.html',
  styleUrl: './todos.page.scss',
})
export class TodosPage {
  protected readonly store = inject(TodosStore);
  protected readonly newTitle = signal('');
  protected readonly filters: { value: TodoFilter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'active', label: 'Aktywne' },
    { value: 'done', label: 'Zrobione' },
  ];

  protected add(): void {
    this.store.add(this.newTitle());
    this.newTitle.set('');
  }
}
