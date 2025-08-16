
/// <reference types="vite/client" />

// Extend the PostCSS plugin typing to fix the plugin conflict
declare module 'postcss' {
  interface Plugin {
    postcssPlugin: string;
    prepare?: (result: any) => any;
  }
}
