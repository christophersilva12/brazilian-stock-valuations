/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWELVEDATA_KEY?: string;
  readonly VITE_BRAPI_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
