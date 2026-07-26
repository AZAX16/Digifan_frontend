import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import { defineConfig } from 'vite'

const hasNetworkProxy = [process.env.HTTPS_PROXY, process.env.HTTP_PROXY].some((value) =>
  Boolean(value?.trim()),
)
const apiProxyAgent = hasNetworkProxy
  ? new https.Agent({ proxyEnv: process.env })
  : undefined

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'https://digifan-api.onrender.com',
        changeOrigin: true,
        agent: apiProxyAgent,
      },
    },
  },
})
