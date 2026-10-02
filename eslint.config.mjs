import { FlatCompat } from '@eslint/eslintrc';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require=createRequire(import.meta.url);
const compat=new FlatCompat({baseDirectory:import.meta.dirname,resolvePluginsRelativeTo:dirname(require.resolve('eslint-config-next/package.json'))});
const config=[
  {ignores:['.next/**','node_modules/**','next-env.d.ts','test-results/**']},
  ...compat.extends('next/core-web-vitals','next/typescript'),
  // Database views deliberately use full page navigation so links work before hydration.
  {rules:{'@next/next/no-html-link-for-pages':'off'}},
];
export default config;
