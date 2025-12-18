import type { ChangeEvent } from 'react';

export function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function handleUppercaseInput(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.target.value = normalizeText(e.target.value);
}
