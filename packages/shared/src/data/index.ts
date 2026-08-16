// @kid-hub/shared presentation catalogues — barrel.
// Static, kid-facing display data (names, colours, icons, copy) that BOTH apps
// render. Previously web-only under apps/web/lib/data/, which is why mobile fell
// back to rendering raw ids like "math". Pure data only — no React, no transport.

export * from './subjects'
export * from './badges'
export * from './games-hub'
export * from './kid-access'
