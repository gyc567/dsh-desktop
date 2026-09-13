import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aura.mobile',
  appName: 'Aura智能工作台',
  webDir: 'www'
  // LAN pairing serves plain http://192.168.x.x; cleartext is allowed via
  // android:usesCleartextTraffic in AndroidManifest.xml. No allowMixedContent
  // here: remote https pages must not be able to pull http subresources.
}

export default config
