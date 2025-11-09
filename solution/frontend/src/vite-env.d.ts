/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_ENV: string
  readonly VITE_ENABLE_WEBSOCKET: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
