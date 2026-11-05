import { loadJS } from './assets.js'

const isBrowser = typeof window !== 'undefined'
let observer = null

function getObserver() {
  if (!isBrowser || typeof IntersectionObserver === 'undefined') {
    return null
  }

  if (!observer) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const el = entry.target

        if (el.dataset.lazy) {
          import(el.dataset.lazy)
            .then((m) => m.init?.(el))
            .catch(() => {})
        }

        observer.unobserve(el)
      }
    }, { threshold: 0.1 })
  }

  return observer
}

// --------------------------------------------------
// INIT LAZY LOAD
// --------------------------------------------------

export function initLazyLoad() {
  if (!isBrowser) return

  const activeObserver = getObserver()
  if (!activeObserver) return

  document
    .querySelectorAll('[data-lazy]')
    .forEach((el) => activeObserver.observe(el))
}

// --------------------------------------------------
// ROUTE LAZY LOAD
// --------------------------------------------------

export function lazyLoadRoute() {
  if (!isBrowser) return

  document.querySelectorAll('[data-lazy]').forEach((el) => {
    import(el.dataset.lazy)
      .then((m) => m.init?.(el))
      .catch(() => {})
  })

  document
    .querySelectorAll(
      "script[type='module'][src$='script.js']"
    )
    .forEach((s) => loadJS(s.src).catch(() => {}))
}
