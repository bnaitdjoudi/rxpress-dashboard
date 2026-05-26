/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HESTIA_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
