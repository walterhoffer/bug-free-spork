export interface PluralForms {
  /** 1 zadanie */
  one: string;
  /** 2–4, 22–24, … zadania */
  few: string;
  /** 0, 5–21, 25–31, … zadań */
  many: string;
}

/** Picks the Polish plural form for `count` (one / few / many). */
export function pluralForm(count: number, forms: PluralForms): string {
  const n = Math.abs(Math.trunc(count));
  if (n === 1) return forms.one;
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    return forms.few;
  }
  return forms.many;
}

/** Formats `count` with the matching Polish plural form, e.g. "5 zadań". */
export function pluralize(count: number, forms: PluralForms): string {
  return `${count} ${pluralForm(count, forms)}`;
}

export const TASK_FORMS: PluralForms = { one: 'zadanie', few: 'zadania', many: 'zadań' };
