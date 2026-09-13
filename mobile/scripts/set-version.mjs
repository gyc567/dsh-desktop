#!/usr/bin/env node
/**
 * Stamp a release version into the Android shell before a build.
 *
 * Usage: node mobile/scripts/set-version.mjs <version>
 *
 * - versionName / versionCode in android/app/build.gradle (versionCode is
 *   derived: core numbers weigh 1e6/1e4/1e2, the last prerelease number adds)
 * - the `<!--VERSION-->` marker in www/index.html (shown on the pair screen)
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

export function versionCodeFrom(version) {
  const [core = '', pre = ''] = version.replace(/^v/, '').split('-')
  const [a = 0, b = 0, c = 0] = core.split('.').map((part) => Number.parseInt(part, 10) || 0)
  const code = a * 1_000_000 + b * 10_000 + c * 100
  const matches = pre.match(/(\d+)(?!.*\d)/)
  return code + (matches ? Number.parseInt(matches[1], 10) : 0)
}

export async function setVersion(version, root = mobileRoot) {
  if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error(`Invalid version: ${version}`)
  }
  const code = versionCodeFrom(version)

  const gradlePath = join(root, 'android/app/build.gradle')
  const gradle = await readFile(gradlePath, 'utf8')
  const nextGradle = gradle
    .replace(/versionCode \d+/, `versionCode ${code}`)
    .replace(/versionName "[^"]*"/, `versionName "${version}"`)
  if (nextGradle === gradle) throw new Error(`version stamps not found in ${gradlePath}`)
  await writeFile(gradlePath, nextGradle)

  const indexPath = join(root, 'www/index.html')
  const index = await readFile(indexPath, 'utf8')
  if (!index.includes('<!--VERSION-->')) throw new Error(`version marker missing in ${indexPath}`)
  await writeFile(indexPath, index.replace('<!--VERSION-->', version))
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const version = process.argv[2]
  if (!version) {
    console.error('Usage: node mobile/scripts/set-version.mjs <version>')
    process.exit(1)
  }
  await setVersion(version)
  console.log(`Stamped mobile shell version ${version} (code ${versionCodeFrom(version)})`)
}
