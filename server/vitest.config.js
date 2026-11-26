import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      STT_PROVIDER: 'mock',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://stt:stt@localhost:5544/stt_test',
    },
    fileParallelism: false,
  },
});
