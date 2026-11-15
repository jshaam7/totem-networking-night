import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
export default defineConfig({ plugins: [react()], build: { rollupOptions: { input: { main: resolve(dirname(fileURLToPath(import.meta.url)), 'index.html'), organizers: resolve(dirname(fileURLToPath(import.meta.url)), 'organizers.html') } } } })
