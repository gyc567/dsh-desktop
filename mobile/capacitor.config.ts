import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aura.mobile',
  appName: 'Aura智能工作台',
  webDir: 'www',
  android: {
    // LAN pairing uses plain http://192.168.x.x; tunnels are https either way.
    allowMixedContent: true
  }
}

export default config
