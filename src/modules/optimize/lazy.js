<<<<<<< HEAD
=======
// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { createObserver } from './observer.js'

>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
import { loadJS } from './assets.js'

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'
<<<<<<< HEAD
=======

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// OBSERVER
// --------------------------------------------------

>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
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
<<<<<<< HEAD
  if (!isBrowser) return

  const activeObserver = getObserver()
  if (!activeObserver) return

  document
    .querySelectorAll('[data-lazy]')
    .forEach((el) => activeObserver.observe(el))
=======
  if (!isDOM) {
    return
  }

  // ----------------------------------------------
  // CREATE OBSERVER
  // ----------------------------------------------

  if (!observer) {
    observer = createObserver()
  }

  if (!observer) {
    return
  }

  // ----------------------------------------------
  // OBSERVE ELEMENTS
  // ----------------------------------------------

  document
    .querySelectorAll("[class*='-'], [data-lazy]")
    .forEach((el) => {
      observer.observe(el)
    })
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
}

// --------------------------------------------------
// ROUTE LAZY LOAD
// --------------------------------------------------

export function lazyLoadRoute() {
  if (!isDOM) {
    return
  }

  // ----------------------------------------------
  // DATA-LAZY MODULES
  // ----------------------------------------------

  document.querySelectorAll('[data-lazy]').forEach((el) => {
    const path = el.dataset?.lazy

    if (!path) {
      return
    }

    import(path)
      .then((module) => {
        if (module && typeof module.init === 'function') {
          return module.init(el)
        }
      })
      .catch((error) => {
        console.warn(
          `[NEXO] Falha ao carregar módulo lazy "${path}".`,
          error
        )
      })
  })

  // ----------------------------------------------
  // MODULE SCRIPTS
  // ----------------------------------------------

  document
    .querySelectorAll(
      "script[type='module'][src$='script.js']"
    )
    .forEach((script) => {
      loadJS(script.src).catch((error) => {
        console.warn(
          `[NEXO] Falha ao carregar script lazy "${script.src}".`,
          error
        )
      })
    })
}

// --------------------------------------------------
// RESET OBSERVER
// --------------------------------------------------

export function resetLazyLoad() {
  if (!observer) {
    return
  }

  observer.disconnect()

  observer = null
}
