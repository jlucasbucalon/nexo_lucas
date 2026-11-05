// ==================================================
// NEXO USER
// LOADING
// ==================================================

// --------------------------------------------------
// STATE
// --------------------------------------------------

let loadingConfigured = false
let loadingVisible = false

// --------------------------------------------------
// CONFIGURE
// --------------------------------------------------

export function configureLoading() {
  loadingConfigured = true
}

// --------------------------------------------------
// ELEMENTS
// --------------------------------------------------

function getLoadingElement() {
  if (typeof document === 'undefined') {
    return null
  }

  return document.getElementById('nexo-loading')
}

export function getSpinnerElement() {
  const loading = getLoadingElement()

  if (!loading) {
    return null
  }

  return loading.querySelector('[data-component="spinner"]')
}

// --------------------------------------------------
// SHOW
// --------------------------------------------------

export function showLoading() {
  const loading = getLoadingElement()

  if (!loading) {
    return
  }

  loadingVisible = true

  loading.removeAttribute('aria-hidden')
  loading.classList.remove('is-hidden')
}

// --------------------------------------------------
// HIDE
// --------------------------------------------------

export function hideLoading() {
  const loading = getLoadingElement()

  if (!loading) {
    return
  }

  loadingVisible = false

  loading.classList.add('is-hidden')
  loading.setAttribute('aria-hidden', 'true')
}

// --------------------------------------------------
// IS VISIBLE
// --------------------------------------------------

export function isLoadingVisible() {
  return loadingVisible
}

// --------------------------------------------------
// IS CONFIGURED
// --------------------------------------------------

export function isLoadingConfigured() {
  return loadingConfigured
}

// --------------------------------------------------
// AUTO HIDE ON LOAD & FALLBACK
// --------------------------------------------------

if (typeof window !== 'undefined') {
  // Esconde o loader quando todos os recursos da página carregarem
  window.addEventListener('load', () => {
    hideLoading()
  })

  // Trava de segurança: Se a página demorar mais de 8 segundos por algum erro, esconde à força
  setTimeout(() => {
    if (isLoadingVisible()) {
      console.warn(
        '[Loading] Escondendo o loader por tempo limite (timeout).'
      )
      hideLoading()
    }
  }, 8000)
}
