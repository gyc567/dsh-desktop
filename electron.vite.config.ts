import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve, dirname } from 'node:path'
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

// Sandboxed preload scripts cannot require relative chunk files at runtime
// (Electron limitation: the preload wrapper only loads a self-contained script).
// Shared value imports (e.g. src/shared/brand.ts used by both preload entries)
// would make rollup emit a cross-entry chunk and break every preload at runtime.
// Fix: rewrite shared imports to a per-importer virtual module so each preload
// entry inlines its own copy — entries stay self-contained, brand.ts remains
// the single source of truth.
function inlineSharedForPreload(): Plugin {
  const target = resolve('src/shared/brand.ts')
  return {
    name: 'inline-shared-for-preload',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer) return null
      const resolved = resolve(dirname(importer), source)
      if (resolved === target || `${resolved}.ts` === target) {
        return `\0virtual:brand-for-${importer.split('/').pop()}.ts`
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0virtual:brand-for-')) {
        return readFileSync(target, 'utf8')
      }
      return null
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin(), inlineSharedForPreload()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
          'windows-menu': resolve('src/preload/windows-menu.ts')
        },
        output: {
          format: 'cjs',
          entryFileNames: '[name].cjs'
        }
      }
    }
  }
})
