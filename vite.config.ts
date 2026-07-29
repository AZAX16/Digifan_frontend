import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import { defineConfig, loadEnv } from 'vite'

function firstConfiguredValue(...values: (string | undefined)[]) {
  return values.find((value) => Boolean(value?.trim()))?.trim()
}

const DEFAULT_API_PROXY_TARGET = 'https://digifan-api.onrender.com'

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = firstConfiguredValue(
    process.env.VITE_DEV_API_PROXY_TARGET,
    fileEnv.VITE_DEV_API_PROXY_TARGET,
  ) ?? DEFAULT_API_PROXY_TARGET
  const useEnvironmentProxy = firstConfiguredValue(
    process.env.VITE_DEV_API_PROXY_USE_ENV,
    fileEnv.VITE_DEV_API_PROXY_USE_ENV,
  )?.toLowerCase() !== 'false'
  const configuredHttpProxy = firstConfiguredValue(
    process.env.HTTP_PROXY,
    process.env.http_proxy,
    fileEnv.HTTP_PROXY,
    fileEnv.http_proxy,
  )
  const configuredHttpsProxy = firstConfiguredValue(
    process.env.HTTPS_PROXY,
    process.env.https_proxy,
    fileEnv.HTTPS_PROXY,
    fileEnv.https_proxy,
  )
  const httpProxy = configuredHttpProxy ?? configuredHttpsProxy
  const httpsProxy = configuredHttpsProxy ?? configuredHttpProxy
  const noProxy = firstConfiguredValue(
    process.env.NO_PROXY,
    process.env.no_proxy,
    fileEnv.NO_PROXY,
    fileEnv.no_proxy,
  )
  const proxyEnv = { ...process.env, HTTP_PROXY: httpProxy, HTTPS_PROXY: httpsProxy, NO_PROXY: noProxy }
  const apiProxyAgent = useEnvironmentProxy && (httpProxy || httpsProxy)
    ? new https.Agent({ proxyEnv }) : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          agent: apiProxyAgent,
        },
      },
    },
  }
})
