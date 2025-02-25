declare namespace NodeJS {
  interface ProcessEnv {
    BACKEND_URL: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
