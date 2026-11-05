<<<<<<< HEAD
// ==================================================
// NEXO USER
// LOADING
// ==================================================

=======
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
// --------------------------------------------------
// STATE
// --------------------------------------------------

let loadingConfigured = false
<<<<<<< HEAD
=======

>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
let loadingVisible = false

// --------------------------------------------------
// CONFIGURE
// --------------------------------------------------

export function configureLoading() {
  loadingConfigured = true
}

// --------------------------------------------------
<<<<<<< HEAD
// ELEMENTS
=======
// ELEMENT
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
// --------------------------------------------------

function getLoadingElement() {
  if (typeof document === 'undefined') {
    return null
  }

  return document.getElementById('nexo-loading')
}

<<<<<<< HEAD
export function getSpinnerElement() {
  const loading = getLoadingElement()

  if (!loading) {
    return null
  }

  return loading.querySelector('[data-component="spinner"]')
}

=======
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
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
<<<<<<< HEAD
=======

>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
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
<<<<<<< HEAD
=======

>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
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
<<<<<<< HEAD

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
=======
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
