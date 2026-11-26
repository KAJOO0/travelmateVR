import { describe, expect, it } from 'vitest';
import { cleanText, isAcceptablePassword, isEmail, isUsername, normalizeEmail } from './security';

describe('cleanText', () => {
  it('strips markup and control characters, and collapses whitespace', () => {
    expect(cleanText('  <b>Jane</b>​  Doe  ')).toBe('Jane Doe');
  });

  it('truncates to the given max length', () => {
    expect(cleanText('a'.repeat(200), 10)).toHaveLength(10);
  });
});

describe('email validation', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeEmail('  Jane.Doe@Example.COM ')).toBe('jane.doe@example.com');
  });

  it('accepts a well-formed address', () => {
    expect(isEmail('jane.doe@example.com')).toBe(true);
  });

  it('rejects an address without a domain', () => {
    expect(isEmail('jane.doe@')).toBe(false);
  });

  it('rejects an address without an @', () => {
    expect(isEmail('jane.doe-example.com')).toBe(false);
  });
});

describe('username validation', () => {
  it('accepts a valid username', () => {
    expect(isUsername('jane_doe-92')).toBe(true);
  });

  it('rejects a username shorter than 3 characters', () => {
    expect(isUsername('ab')).toBe(false);
  });

  it('rejects a username starting with a separator', () => {
    expect(isUsername('-jane')).toBe(false);
  });

  it('is case-insensitive via normalization', () => {
    expect(isUsername('Jane.Doe')).toBe(true);
  });
});

describe('isAcceptablePassword', () => {
  it('accepts a password meeting every composition rule', () => {
    expect(isAcceptablePassword('Str0ng!Passw0rd')).toBe(true);
  });

  it('rejects a password shorter than the minimum length', () => {
    expect(isAcceptablePassword('Sh0rt!')).toBe(false);
  });

  it('rejects a password missing a symbol', () => {
    expect(isAcceptablePassword('NoSymbolsHere123')).toBe(false);
  });

  it('rejects a password missing an uppercase letter', () => {
    expect(isAcceptablePassword('nouppercase1!')).toBe(false);
  });

  it('rejects a password containing a control character', () => {
    expect(isAcceptablePassword('Str0ng!Pass\u0000word')).toBe(false);
  });
});
