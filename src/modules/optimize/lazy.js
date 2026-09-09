// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { createObserver } from './observer.js'

import { loadJS } from './assets.js'

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// OBSERVER
// --------------------------------------------------

let observer = null

// --------------------------------------------------
// INIT LAZY LOAD
// --------------------------------------------------

export function initLazyLoad() {
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
