import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Mock OpenAI para testes que importam route handlers
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

// Garantir env vars para testes
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'test-key';
}

// Limpa o estado após cada teste
afterEach(() => {
  cleanup();
});

