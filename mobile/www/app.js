import { Preferences } from '@capacitor/preferences'
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning'

const HISTORY_KEY = 'url_history'
const HISTORY_LIMIT = 5

const urlInput = document.getElementById('url')
const errorEl = document.getElementById('error')
const historyEl = document.getElementById('history')
const historyPanel = document.getElementById('history-panel')
const scannerEl = document.getElementById('scanner')

function showError(message) {
  errorEl.textContent = message
  errorEl.style.display = message ? 'block' : 'none'
}

function normalizeUrl(raw) {
  const value = raw.trim()
  if (!value) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

async function readHistory() {
  const { value } = await Preferences.get({ key: HISTORY_KEY })
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

async function saveToHistory(url) {
  const history = await readHistory()
  const next = [url, ...history.filter((item) => item !== url)].slice(0, HISTORY_LIMIT)
  await Preferences.set({ key: HISTORY_KEY, value: JSON.stringify(next) })
}

function renderHistory(history) {
  historyPanel.style.display = history.length ? 'block' : 'none'
  historyEl.replaceChildren(
    ...history.map((url) => {
      const button = document.createElement('button')
      button.className = 'ghost'
      button.textContent = url
      button.addEventListener('click', () => {
        urlInput.value = url
      })
      return button
    })
  )
}

function connect(raw) {
  const url = normalizeUrl(raw)
  if (!url) {
    showError('链接无效：需要 http(s) 地址')
    return
  }
  showError('')
  void saveToHistory(url)
  // Navigate the shell WebView to the bridge; pairing and the mobile UI are
  // served entirely by the desktop side, auth included (dsh_mobile cookie).
  window.location.href = url
}

document.getElementById('connect').addEventListener('click', () => connect(urlInput.value))

document.getElementById('paste').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text) urlInput.value = text.trim()
  } catch {
    showError('无法读取剪贴板，请手动粘贴')
  }
})

document.getElementById('scan').addEventListener('click', async () => {
  try {
    const granted = await BarcodeScanner.checkPermission({ force: true })
    if (!granted.granted) {
      showError('需要相机权限才能扫码')
      return
    }
    showError('')
    document.body.style.background = 'transparent'
    scannerEl.classList.add('visible')
    const result = await BarcodeScanner.startScan()
    scannerEl.classList.remove('visible')
    document.body.style.background = ''
    if (result.hasContent) connect(result.content)
  } catch {
    scannerEl.classList.remove('visible')
    document.body.style.background = ''
    showError('扫码失败，请改用粘贴链接')
  }
})

document.getElementById('cancel-scan').addEventListener('click', () => {
  void BarcodeScanner.stopScan()
})

void readHistory().then(renderHistory)
