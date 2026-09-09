const isBrowser = typeof window !== 'undefined'

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

export function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)')
    .matches
    ? 'dark'
    : 'light'
}

export function getSavedTheme() {
  return localStorage.getItem('theme')
}

export function applyTheme(theme) {
  const html = document.documentElement

  const safeTheme = theme === 'dark' ? 'dark' : 'light'

  html.dataset.theme = safeTheme

  localStorage.setItem('theme', safeTheme)

  document
    .querySelectorAll('.button-theme')
    .forEach((toggle) => {
      toggle.setAttribute(
        'aria-pressed',
        String(safeTheme === 'dark')
      )
    })
}

export function initTheme() {
  const saved = getSavedTheme()

  applyTheme(saved || getSystemTheme())
}

export function bindThemeToggle(root = document) {
  if (!root || !root.querySelectorAll) {
    return
  }

  root
    .querySelectorAll('.button-theme')
    .forEach((toggle) => {
      if (toggle.dataset.themeBound === 'true') {
        return
      }

      toggle.addEventListener('click', () => {
        const html = document.documentElement

        const current = html.dataset.theme || 'light'

        const next = current === 'dark' ? 'light' : 'dark'

        applyTheme(next)
      })

      toggle.dataset.themeBound = 'true'
    })
}

function syncThemeButtons(root = document) {
  if (!root || !root.querySelectorAll) {
    return
  }

  const currentTheme =
    document.documentElement.dataset.theme || 'light'

  root
    .querySelectorAll('.button-theme')
    .forEach((toggle) => {
      toggle.setAttribute(
        'aria-pressed',
        String(currentTheme === 'dark')
      )
    })
}

// --------------------------------------------------
// INIT CLIENT ONLY
// --------------------------------------------------

if (isBrowser) {
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      initTheme()
      bindThemeToggle()
      syncThemeButtons()
    },
    { once: true }
  )

  document.addEventListener('spa:pageLoaded', (event) => {
    const root = event?.detail?.root || document

    bindThemeToggle(root)
    syncThemeButtons(root)
  })
}
