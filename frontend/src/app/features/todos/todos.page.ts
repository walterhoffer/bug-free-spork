import { Component, computed, inject, signal } from '@angular/core';
import { pluralize, TASK_FORMS } from './pluralize';
import { TodoFilter, TodosStore } from './todos.store';

@Component({
  selector: 'app-todos-page',
  templateUrl: './todos.page.html',
  styleUrl: './todos.page.scss',
})
export class TodosPage {
  protected readonly store = inject(TodosStore);
  protected readonly newTitle = signal('');
  protected readonly canAdd = computed(() => this.newTitle().trim().length > 0);
  protected readonly summary = computed(
    () => `${pluralize(this.store.remainingCount(), TASK_FORMS)} do zrobienia`,
  );
  protected readonly filters: { value: TodoFilter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'active', label: 'Aktywne' },
    { value: 'done', label: 'Zrobione' },
  ];

  protected add(): void {
    if (!this.canAdd()) return;
    this.store.add(this.newTitle());
    this.newTitle.set('');
  }
}
