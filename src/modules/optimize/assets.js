// --------------------------------------------------
// ENV DETECTION
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// IGNORED ERRORS
// --------------------------------------------------

const IGNORED_ERRORS = [
  'A listener indicated an asynchronous response',
  'chrome-extension',
]

function shouldIgnore(msg) {
  if (!msg) {
    return false
  }

  const text = String(msg)

  return IGNORED_ERRORS.some((pattern) =>
    text.includes(pattern)
  )
}

// --------------------------------------------------
// ERROR HANDLER
// NO SIDE EFFECT AT IMPORT TIME
// --------------------------------------------------

function ignoreError(event) {
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

// --------------------------------------------------
// REGISTER GLOBAL HANDLERS
// ONLY CLIENT
// --------------------------------------------------

function setupErrorHandlers() {
  if (!isBrowser) {
    return
  }

  window.addEventListener('error', ignoreError, true)

  window.addEventListener(
    'unhandledrejection',
    ignoreError,
    true
  )
}

// --------------------------------------------------
// ASSET TRACKING
// --------------------------------------------------

const loadedAssets = {
  css: new Set(),
  js: new Set(),
}

// --------------------------------------------------
// ASSET LOADING
// --------------------------------------------------

const loadingAssets = {
  css: new Map(),
  js: new Map(),
}

// --------------------------------------------------
// LOAD CSS
// --------------------------------------------------

export async function loadCSS(
  href,
  { preload = false } = {}
) {
  if (!isDOM || !href) {
    return
  }

  const url = new URL(href, document.baseURI).href

  // ------------------------------------------------
  // ALREADY LOADED
  // ------------------------------------------------

  if (loadedAssets.css.has(url)) {
    return
  }

  // ------------------------------------------------
  // ALREADY LOADING
  // ------------------------------------------------

  if (loadingAssets.css.has(url)) {
    return loadingAssets.css.get(url)
  }

  // ------------------------------------------------
  // CREATE LOAD
  // ------------------------------------------------

  const promise = new Promise((resolve) => {
    const existing = document.querySelector(
      `link[rel="stylesheet"][href="${url}"]`
    )

    if (existing) {
      loadedAssets.css.add(url)
      resolve()
      return
    }

    const link = document.createElement('link')

    let finished = false

    const done = (success = false) => {
      if (finished) {
        return
      }

      finished = true

      if (success) {
        loadedAssets.css.add(url)
      }

      resolve()
    }

    if (preload) {
      link.rel = 'preload'

      link.as = 'style'

      link.onload = () => {
        link.rel = 'stylesheet'

        done(true)
      }
    } else {
      link.rel = 'stylesheet'

      link.onload = () => {
        done(true)
      }
    }

    link.onerror = (error) => {
      console.warn(
        `[NEXO] Não foi possível carregar CSS: ${url}`,
        error
      )

      done(false)
    }

    link.href = url

    document.head.appendChild(link)
  })

  loadingAssets.css.set(url, promise)

  try {
    await promise
  } finally {
    loadingAssets.css.delete(url)
  }
}

// --------------------------------------------------
// LOAD JS
// --------------------------------------------------

export async function loadJS(src, module = true) {
  if (!isDOM || !src) {
    return
  }

  const url = new URL(src, document.baseURI).href

  // ------------------------------------------------
  // ALREADY LOADED
  // ------------------------------------------------

  if (loadedAssets.js.has(url)) {
    return
  }

  // ------------------------------------------------
  // ALREADY LOADING
  // ------------------------------------------------

  if (loadingAssets.js.has(url)) {
    return loadingAssets.js.get(url)
  }

  // ------------------------------------------------
  // CREATE LOAD
  // ------------------------------------------------

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.src = url

    script.defer = true

    if (module) {
      script.type = 'module'
    }

    let finished = false

    const done = (success = false) => {
      if (finished) {
        return
      }

      finished = true

      if (success) {
        loadedAssets.js.add(url)

        resolve()
      } else {
        reject(new Error(`Falha ao carregar ${url}`))
      }
    }

    script.onload = () => {
      done(true)
    }

    script.onerror = () => {
      done(false)
    }

    document.body.appendChild(script)
  })

  loadingAssets.js.set(url, promise)

  try {
    await promise
  } finally {
    loadingAssets.js.delete(url)
  }
}

// --------------------------------------------------
// INTERSECTION OBSERVER
// GENERIC LAZY LOAD
// --------------------------------------------------

let lazyObserver = null

function setupLazyObserver() {
  if (
    !isDOM ||
    typeof IntersectionObserver === 'undefined'
  ) {
    return
  }

  if (lazyObserver) {
    return
  }

  lazyObserver = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue
        }

        const el = entry.target

        // ----------------------------------------
        // GENERIC LAZY MODULE
        // ----------------------------------------

        if (el.dataset?.lazy) {
          try {
            const module = await import(el.dataset.lazy)

            if (
              module &&
              typeof module.init === 'function'
            ) {
              await module.init(el)
            }
          } catch (error) {
            console.warn(
              `[NEXO] Falha ao carregar módulo lazy "${el.dataset.lazy}".`,
              error
            )
          }
        }

        // ----------------------------------------
        // STOP OBSERVING
        // ----------------------------------------

        lazyObserver.unobserve(el)
      }
    },
    {
      threshold: 0.1,
    }
  )
}

// --------------------------------------------------
// INIT LAZY SYSTEM
// --------------------------------------------------

export function initLazyLoad() {
  if (!isDOM) {
    return
  }

  if (!lazyObserver) {
    setupLazyObserver()
  }

  if (!lazyObserver) {
    return
  }

  document.querySelectorAll('[data-lazy]').forEach((el) => {
    lazyObserver.observe(el)
  })
}

// --------------------------------------------------
// ROUTE LAZY LOAD
// --------------------------------------------------

export async function lazyLoadRoute() {
  if (!isDOM) {
    return
  }

  // ------------------------------------------------
  // DATA-LAZY
  // ------------------------------------------------

  document.querySelectorAll('[data-lazy]').forEach((el) => {
    const path = el.dataset?.lazy

    if (!path) {
      return
    }

    import(path)
      .then((module) => module.init?.(el))
      .catch((error) => {
        console.warn(
          `[NEXO] Falha ao carregar módulo lazy "${path}".`,
          error
        )
      })
  })

  // ------------------------------------------------
  // MODULE SCRIPTS
  // ------------------------------------------------

  document
    .querySelectorAll(
      "script[type='module'][src$='script.js']"
    )
    .forEach((script) => {
      loadJS(script.src).catch(() => {})
    })
}

// --------------------------------------------------
// BOOTSTRAP EVENTS
// CLIENT ONLY
// --------------------------------------------------

function setupAutoInit() {
  if (!isBrowser) {
    return
  }

  document.addEventListener(
    'DOMContentLoaded',
    initLazyLoad
  )

  document.addEventListener('spa:pageLoaded', initLazyLoad)
}

// --------------------------------------------------
// INIT ENTRYPOINT
// --------------------------------------------------

export function initOptimizer() {
  if (!isBrowser) {
    return
  }

  setupErrorHandlers()
  setupLazyObserver()
  setupAutoInit()
}

// --------------------------------------------------
// OPTIONAL GLOBAL SHIELD
// CONSOLE FILTER
// --------------------------------------------------

function setupConsoleFilter() {
  if (!isBrowser) {
    return
  }

  const nativeError = console.error

  console.error = (...args) => {
    const msg = args.join(' ')

    if (shouldIgnore(msg)) {
      return
    }

    nativeError(...args)
  }

  const nativeWarn = console.warn

  console.warn = (...args) => {
    const msg = args.join(' ')

    if (shouldIgnore(msg)) {
      return
    }

    nativeWarn(...args)
  }
}

// --------------------------------------------------
// INIT CONSOLE FILTER
// --------------------------------------------------

if (isBrowser) {
  setupConsoleFilter()
}
