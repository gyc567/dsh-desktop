const packageJson = require('./package.json')

module.exports = {
  ...packageJson.build,
  appId: 'io.dsh.desktop.dev',
  productName: 'Aura Dev',
  directories: {
    ...packageJson.build.directories,
    output: 'dist-dev'
  },
  extraMetadata: {
    name: 'dsh-desktop-dev',
    productName: 'Aura Dev',
    dshDesktopChannel: 'development'
  },
  artifactName: 'aura-dev-${os}-${arch}.${ext}',
  nsis: {
    ...packageJson.build.nsis,
    artifactName: 'aura-dev-windows-${arch}-setup.${ext}'
  },
  publish: null
}
