const isBrowser = typeof window !== 'undefined'

// --------------------------------------------------
// THEME HELPERS
// --------------------------------------------------

function applyTheme(theme) {
  if (!isBrowser) {
    return
  }

  const html = document.documentElement

  const safeTheme = theme === 'dark' ? 'dark' : 'light'

  html.dataset.theme = safeTheme

  localStorage.setItem('theme', safeTheme)

  // Atualiza todos os botões de tema
  document
    .querySelectorAll('.button-theme')
    .forEach((toggle) => {
      toggle.setAttribute(
        'aria-pressed',
        String(safeTheme === 'dark')
      )
    })
}

// --------------------------------------------------
// BUTTON
// --------------------------------------------------

function bindThemeToggle(root = document) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return
  }

  // Caso o próprio root seja o botão
  const buttons = []

  if (
    root.nodeType === 1 &&
    root.matches?.('.button-theme')
  ) {
    buttons.push(root)
  }

  // Botões dentro do root
  buttons.push(...root.querySelectorAll('.button-theme'))

  buttons.forEach((toggle) => {
    // Evita eventos duplicados
    if (toggle.dataset.themeBound === 'true') {
      return
    }

    toggle.addEventListener('click', () => {
      const current =
        document.documentElement.dataset.theme || 'light'

      const next = current === 'dark' ? 'light' : 'dark'

      applyTheme(next)
    })

    toggle.dataset.themeBound = 'true'
  })
}

// --------------------------------------------------
// MODEL
// --------------------------------------------------

if (isBrowser) {
  window.Components = window.Components || {}

  window.Components['button-theme'] = {
    init() {
      bindThemeToggle(window.container || document)
    },
  }
}
