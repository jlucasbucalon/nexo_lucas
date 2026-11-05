// --------------------------------------------------
// ENV DETECTION
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'
const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// IMPORTS (SSR SAFE)
// --------------------------------------------------

import { config } from '../../main.js'
import { shouldIgnore } from './errorFilter.js'

// --------------------------------------------------
// ASSET TRACKING
// --------------------------------------------------

const loadedAssets = {
  css: new Set(),
  js: new Set(),
}

// --------------------------------------------------
// LOAD CSS
// --------------------------------------------------

export async function loadCSS(
  href,
  { preload = false } = {}
) {
  if (!isDOM) return

  const url = new URL(href, document.baseURI).href
  if (loadedAssets.css.has(url)) return

  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) return
  } catch {}

  return new Promise((resolve) => {
    const link = document.createElement('link')

    if (preload) {
      link.rel = 'preload'
      link.as = 'style'
      link.onload = () => {
        link.rel = 'stylesheet'
        resolve()
      }
    } else {
      link.rel = 'stylesheet'
      link.onload = resolve
    }

    link.href = url
    document.head.appendChild(link)

    loadedAssets.css.add(url)
  })
}

// --------------------------------------------------
// LOAD JS
// --------------------------------------------------

export async function loadJS(src, module = true) {
  if (!isDOM) return

  const url = new URL(src, document.baseURI).href
  if (loadedAssets.js.has(url)) return

  try {
    const res = await fetch(url, { method: 'HEAD' })
    if (!res.ok) return
  } catch {}

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.src = url
    script.defer = true
    if (module) script.type = 'module'

    script.onload = resolve
    script.onerror = () =>
      reject(new Error(`Falha ao carregar ${url}`))

    document.body.appendChild(script)
    loadedAssets.js.add(url)
  })
}

// --------------------------------------------------
// INTERSECTION OBSERVER (LAZY LOAD)
// --------------------------------------------------

let lazyObserver = null

function setupLazyObserver() {
  if (!isDOM || typeof IntersectionObserver === 'undefined')
    return

  lazyObserver = new IntersectionObserver(
    async (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const el = entry.target

        for (const cls of [...el.classList].filter((c) =>
          c.includes('-')
        )) {
          const [category, name] = cls.split('-')

          const css = `${config.dirs.models}/${category}/${name}/styles.css`
          const js = `${config.dirs.models}/${category}/${name}/script.js`

          try {
            await loadCSS(css)
            await loadJS(js)

            const key = `${category}-${name}`
            window.Components?.[key]?.init?.()
          } catch {}
        }

        if (el.dataset.lazy) {
          import(el.dataset.lazy)
            .then((m) => m.init?.(el))
            .catch(() => {})
        }

        lazyObserver.unobserve(el)
      }
    },
    { threshold: 0.1 }
  )
}

// --------------------------------------------------
// INIT LAZY SYSTEM
// --------------------------------------------------

export function initLazyLoad() {
  if (!isDOM) return

  if (!lazyObserver) setupLazyObserver()

  document
    .querySelectorAll("[class*='-'], [data-lazy]")
    .forEach((el) => lazyObserver.observe(el))
}

// --------------------------------------------------
// ROUTE LAZY LOAD
// --------------------------------------------------

export async function lazyLoadRoute() {
  if (!isDOM) return

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

// --------------------------------------------------
// BOOTSTRAP EVENTS (CLIENT ONLY)
// --------------------------------------------------

function setupAutoInit() {
  if (!isBrowser) return

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
  if (!isBrowser) return

  setupLazyObserver()
  setupAutoInit()
}

// --------------------------------------------------
// OPTIONAL GLOBAL SHIELD (console filter)
// --------------------------------------------------

function setupConsoleFilter() {
  if (!isBrowser) return

  const nativeError = console.error
  console.error = (...args) => {
    const msg = args.join(' ')
    if (shouldIgnore(msg)) return
    nativeError(...args)
  }

  const nativeWarn = console.warn
  console.warn = (...args) => {
    const msg = args.join(' ')
    if (shouldIgnore(msg)) return
    nativeWarn(...args)
  }
}

if (isBrowser) {
  setupConsoleFilter()
}
