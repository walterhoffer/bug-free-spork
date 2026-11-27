import { pluralForm, pluralize, TASK_FORMS } from './pluralize';

describe('pluralize', () => {
  it.each([
    [0, '0 zadań'],
    [1, '1 zadanie'],
    [2, '2 zadania'],
    [5, '5 zadań'],
    [12, '12 zadań'],
    [22, '22 zadania'],
    [25, '25 zadań'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(pluralize(count, TASK_FORMS)).toBe(expected);
  });

  it('handles the 12–14 exception and larger numbers', () => {
    expect(pluralForm(3, TASK_FORMS)).toBe('zadania');
    expect(pluralForm(4, TASK_FORMS)).toBe('zadania');
    expect(pluralForm(13, TASK_FORMS)).toBe('zadań');
    expect(pluralForm(14, TASK_FORMS)).toBe('zadań');
    expect(pluralForm(21, TASK_FORMS)).toBe('zadań');
    expect(pluralForm(101, TASK_FORMS)).toBe('zadań');
    expect(pluralForm(104, TASK_FORMS)).toBe('zadania');
    expect(pluralForm(112, TASK_FORMS)).toBe('zadań');
  });
});
