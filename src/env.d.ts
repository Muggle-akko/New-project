/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_TWIKOO_ENV_ID?: string;
  readonly PUBLIC_TWIKOO_JS_URL?: string;
  readonly PUBLIC_TWIKOO_LANG?: string;
  readonly PUBLIC_TWIKOO_REGION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
