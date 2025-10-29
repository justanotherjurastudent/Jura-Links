import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Redirect imports of 'obsidian' (which fails to resolve in pure vitest env)
      // to our lightweight mock implementation used only for tests.
      obsidian: path.resolve(__dirname, 'tests/mocks/obsidianMock.ts'),
    },
  },
  test: {
    environment: 'node',
  }
});
