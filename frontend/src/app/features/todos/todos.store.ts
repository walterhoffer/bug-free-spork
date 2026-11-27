import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

export type TodoFilter = 'all' | 'active' | 'done';

interface TodosState {
  todos: Todo[];
  filter: TodoFilter;
}

const initialState: TodosState = {
  todos: [],
  filter: 'all',
};

export const TodosStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ todos, filter }) => ({
    visibleTodos: computed(() => {
      switch (filter()) {
        case 'active':
          return todos().filter((t) => !t.done);
        case 'done':
          return todos().filter((t) => t.done);
        default:
          return todos();
      }
    }),
    counts: computed<Record<TodoFilter, number>>(() => {
      const done = todos().filter((t) => t.done).length;
      return { all: todos().length, active: todos().length - done, done };
    }),
    remainingCount: computed(() => todos().filter((t) => !t.done).length),
  })),
  withMethods((store) => ({
    add(title: string): void {
      const trimmed = title.trim();
      if (!trimmed) return;
      const nextId = Math.max(0, ...store.todos().map((t) => t.id)) + 1;
      patchState(store, (s) => ({ todos: [...s.todos, { id: nextId, title: trimmed, done: false }] }));
    },
    toggle(id: number): void {
      patchState(store, (s) => ({
        todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      }));
    },
    remove(id: number): void {
      patchState(store, (s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
    },
    setFilter(filter: TodoFilter): void {
      patchState(store, { filter });
    },
  })),
);
