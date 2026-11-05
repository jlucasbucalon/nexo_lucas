const IGNORED_ERRORS = [
  'A listener indicated an asynchronous response',
  'chrome-extension',
]

export function shouldIgnore(msg) {
  if (!msg) return false
  const text = String(msg)
  return IGNORED_ERRORS.some((p) => text.includes(p))
}

export function ignoreError(event) {
  const msg =
    event.message ||
    event.reason?.message ||
    event.reason ||
    ''

  if (shouldIgnore(msg)) {
    try {
      event.preventDefault?.()
      event.stopImmediatePropagation?.()
    } catch {}
  }
}

export function setupErrorFilter() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', ignoreError, true)
  window.addEventListener(
    'unhandledrejection',
    ignoreError,
    true
  )
}
