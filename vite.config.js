
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/week4-todo-app/',
  plugins: [tailwindcss()],
})
