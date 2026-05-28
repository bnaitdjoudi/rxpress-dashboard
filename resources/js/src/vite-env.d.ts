/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HESTIA_URL: string;
  readonly VITE_SAAS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
