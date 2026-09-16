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
// ELEMENT
// --------------------------------------------------

function getLoadingElement() {
  if (typeof document === 'undefined') {
    return null
  }

  return document.getElementById('nexo-loading')
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
