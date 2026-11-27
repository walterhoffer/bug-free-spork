import { TestBed } from '@angular/core/testing';
import { TodosStore } from './todos.store';

describe('TodosStore', () => {
  let store: InstanceType<typeof TodosStore>;

  beforeEach(() => {
    store = TestBed.inject(TodosStore);
  });

  it('adds, toggles and removes todos', () => {
    store.add('Pierwsze');
    store.add('  ');
    store.add('Drugie');
    expect(store.todos().map((t) => t.title)).toEqual(['Pierwsze', 'Drugie']);
    expect(store.remainingCount()).toBe(2);

    const first = store.todos()[0];
    store.toggle(first.id);
    expect(store.remainingCount()).toBe(1);

    store.setFilter('done');
    expect(store.visibleTodos().map((t) => t.title)).toEqual(['Pierwsze']);

    store.remove(first.id);
    expect(store.todos().length).toBe(1);
  });

  it('counts todos per filter as they are added, toggled and removed', () => {
    expect(store.counts()).toEqual({ all: 0, active: 0, done: 0 });

    store.add('A');
    store.add('B');
    store.add('C');
    expect(store.counts()).toEqual({ all: 3, active: 3, done: 0 });

    const [a, b] = store.todos();
    store.toggle(a.id);
    store.toggle(b.id);
    expect(store.counts()).toEqual({ all: 3, active: 1, done: 2 });

    store.toggle(b.id);
    expect(store.counts()).toEqual({ all: 3, active: 2, done: 1 });

    store.remove(a.id);
    expect(store.counts()).toEqual({ all: 2, active: 2, done: 0 });
  });

  it('counts do not depend on the active filter', () => {
    store.add('A');
    store.toggle(store.todos()[0].id);
    store.setFilter('active');
    expect(store.visibleTodos()).toEqual([]);
    expect(store.counts()).toEqual({ all: 1, active: 0, done: 1 });
  });
});
