/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SAAS_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
