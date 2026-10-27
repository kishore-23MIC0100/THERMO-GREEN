import { it, expect } from 'vitest';
import { validateOllamaUrl } from './ollama';
it('restricts the advisory model to explicit local endpoints', () => {
  expect(validateOllamaUrl('http://localhost:11434')).toBe('http://localhost:11434');
  expect(() => validateOllamaUrl('https://untrusted.example')).toThrow();
  expect(() => validateOllamaUrl('javascript:alert(1)')).toThrow();
  expect(() => validateOllamaUrl('http://user:secret@localhost')).toThrow();
  expect(() => validateOllamaUrl('http://[::1]:11434')).toThrow(/localhost or 127.0.0.1/);
});
