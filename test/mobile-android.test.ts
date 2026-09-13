import { describe, expect, it } from 'vitest'
import { cp, mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { versionCodeFrom } from '../mobile/scripts/set-version.mjs'

const projectRoot = join(import.meta.dirname, '..')

const load = () =>
  readFile(join(projectRoot, '.github', 'workflows', 'mobile-android.yml'), 'utf8')

describe('mobile android workflow', () => {
  it('builds the APK on tag pushes, mobile PRs, and manual dispatch', async () => {
    const yml = await load()
    expect(yml).toContain("tags:\n      - 'v*'")
    expect(yml).toContain('pull_request:')
    expect(yml).toContain('workflow_dispatch:')
    expect(yml).toContain('runs-on: ubuntu-24.04')
  })

  it('degrades gracefully when the signing keystore secret is absent', async () => {
    const yml = await load()
    expect(yml).toContain('id: mobile_secrets')
    expect(yml).toContain('secrets.MOBILE_ANDROID_KEYSTORE')
    expect(yml).toContain('::warning::')
    expect(yml).toMatch(
      /keystore_missing: \$\{\{ steps\.mobile_secrets\.outputs\.missing \}\}/
    )
    expect(yml).toMatch(
      /if: steps\.mobile_secrets\.outputs\.missing != '1'/
    )
  })

  it('stamps the tag version, syncs Capacitor, and uploads the aura-named APK', async () => {
    const yml = await load()
    expect(yml).toContain('node scripts/set-version.mjs "${GITHUB_REF_NAME#v}"')
    expect(yml).toContain('npx cap sync android')
    expect(yml).toContain('./gradlew assembleRelease')
    expect(yml).toContain('androiddebugkey')
    expect(yml).toContain('cp android/app/build/outputs/apk/release/app-release.apk aura-mobile-android.apk')
    expect(yml).toMatch(/name: mobile-android/)
    expect(yml).toContain('path: mobile/aura-mobile-android.apk')
  })
})

describe('mobile shell package', () => {
  it('carries the Aura brand and the fork-safe package id', async () => {
    const config = await readFile(join(projectRoot, 'mobile', 'capacitor.config.ts'), 'utf8')
    expect(config).toContain("appId: 'com.aura.mobile'")
    expect(config).toContain("appName: 'Aura智能工作台'")
    expect(config).toContain("webDir: 'www'")

    const manifest = await readFile(
      join(projectRoot, 'mobile', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
      'utf8'
    )
    expect(manifest).toContain('android:usesCleartextTraffic="true"')

    const gradle = await readFile(
      join(projectRoot, 'mobile', 'android', 'app', 'build.gradle'),
      'utf8'
    )
    expect(gradle).toContain('key.properties')
    expect(gradle).toContain('storeFile file("$rootDir/debug.keystore")')
    expect(gradle).toContain('applicationId "com.aura.mobile"')
  })

  it('hardens the local pair screen (CSP) and ships a sane version fallback', async () => {
    const index = await readFile(join(projectRoot, 'mobile', 'www', 'index.html'), 'utf8')
    expect(index).toContain('Content-Security-Policy')
    expect(index).toContain('<!--VERSION:dev-->')

    const app = await readFile(join(projectRoot, 'mobile', 'www', 'app.js'), 'utf8')
    expect(app).not.toContain('innerHTML')
    // The history write must complete before navigation tears the context down
    expect(app).toContain('await saveToHistory(url)')
  })

  it('keeps the shell dependency-free of desktop-only code', async () => {
    const pkg = JSON.parse(
      await readFile(join(projectRoot, 'mobile', 'package.json'), 'utf8')
    )
    expect(pkg.name).toBe('aura-mobile')
    const allDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).join(' ')
    expect(allDeps).not.toContain('electron')
    expect(allDeps).not.toContain('koffi')
  })
})

describe('set-version script', () => {
  it('derives a monotonically increasing versionCode from semver-ish tags', () => {
    expect(versionCodeFrom('0.1.1')).toBe(10100)
    expect(versionCodeFrom('0.1.1-aura.5')).toBe(10105)
    expect(versionCodeFrom('0.1.1-aura.6')).toBe(10106)
    expect(versionCodeFrom('1.2.3')).toBe(1020300)
    expect(versionCodeFrom('1.2.3-rc.10')).toBe(1020310)
    expect(versionCodeFrom('v0.1.1-aura.6')).toBe(10106)
  })

  it('rejects versions that would collide or do not parse cleanly', () => {
    // 0.1.1-aura.105 would collide with 0.1.2-aura.5 (both versionCode 10205)
    expect(() => versionCodeFrom('0.1.1-aura.105')).toThrow('collide')
    expect(() => versionCodeFrom('0.1.2-aura.5')).not.toThrow()
  })

  it('stamps build.gradle and the pair screen marker on fixture copies', async () => {
    const { setVersion } = await import('../mobile/scripts/set-version.mjs')
    const fixture = await mkdtemp(join(tmpdir(), 'aura-mobile-version-'))
    await cp(join(projectRoot, 'mobile', 'android'), join(fixture, 'android'), {
      recursive: true
    })
    await cp(join(projectRoot, 'mobile', 'www'), join(fixture, 'www'), {
      recursive: true
    })

    await setVersion('0.1.1-aura.6', fixture)

    const gradle = await readFile(join(fixture, 'android', 'app', 'build.gradle'), 'utf8')
    expect(gradle).toContain('versionCode 10106')
    expect(gradle).toContain('versionName "0.1.1-aura.6"')
    const index = await readFile(join(fixture, 'www', 'index.html'), 'utf8')
    expect(index).toContain('Aura 移动壳 v0.1.1-aura.6')
    expect(index).not.toMatch(/<!--VERSION/)

    await expect(setVersion('nope', fixture)).rejects.toThrow('Invalid version')
    await expect(setVersion('1.2.3junk', fixture)).rejects.toThrow('Invalid version')
  })
})
