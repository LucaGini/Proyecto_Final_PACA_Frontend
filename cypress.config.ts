import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', // URL donde corre Angular
    supportFile: false
  }
});
