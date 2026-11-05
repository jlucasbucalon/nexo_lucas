// --------------------------------------------------
// ENV DETECTION (SSR SAFE)
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// STATE GLOBAL
// --------------------------------------------------

let imageMap = {}

let linkMap = {}

let iconMap = {}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

<<<<<<< HEAD
const getTheme = () => {
  if (!isDOM) return 'light'
  return document.documentElement.dataset.theme || 'light'
}

const getWidth = () =>
  isBrowser ? window.innerWidth : 1024

function debounce(fn, delay = 150) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
=======
function getTheme() {
  if (!isDOM) {
    return 'light'
  }

  return document.documentElement.dataset.theme || 'light'
}

function getWidth() {
  return isBrowser ? window.innerWidth : 1024
}

function debounce(fn, delay = 150) {
  let timer = null

  return (...args) => {
    clearTimeout(timer)

    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

function getElements(root, selector) {
  if (!isDOM || !root) {
    return []
  }

  const elements = []

  if (root.nodeType === 1 && root.matches?.(selector)) {
    elements.push(root)
  }

  if (typeof root.querySelectorAll === 'function') {
    elements.push(...root.querySelectorAll(selector))
  }

  return elements
}

// --------------------------------------------------
// SETUP DOS MAPAS
// --------------------------------------------------

export function setAssetMaps(maps = {}) {
  imageMap = maps.imageMap || {}

  linkMap = maps.linkMap || {}

  iconMap = maps.iconMap || {}

  if (!isDOM) {
    return
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
  }

  /*
    Os mapas agora são aplicados imediatamente.

    Isso é importante no carregamento inicial,
    porque os elementos podem já existir no DOM
    quando main.js registra os mapas.
  */

  applyAssets(document)
}

// --------------------------------------------------
// SETUP DOS MAPAS
// --------------------------------------------------

export function setAssetMaps(maps = {}) {
  imageMap = maps.imageMap || {}
  linkMap = maps.linkMap || {}
  iconMap = maps.iconMap || {}

  if (!isDOM) return

  applyAssets(document)
}

// --------------------------------------------------
// IMAGES
// --------------------------------------------------

function resolveImage(cfg) {
  if (!cfg?.src) {
    return ''
  }

  const theme = getTheme()

  const width = getWidth()
  const isDark = theme === 'dark'

  // ------------------------------------------------
  // RESPONSIVE
  // ------------------------------------------------

  if (cfg.set) {
    const okMin =
      !cfg.set.minWidth || width >= cfg.set.minWidth

    const okMax =
      !cfg.set.maxWidth || width <= cfg.set.maxWidth

    if (okMin && okMax) {
      return isDark && cfg.set.dark
        ? cfg.set.dark
        : cfg.set.src
    }
  }

  // ------------------------------------------------
  // DARK
  // ------------------------------------------------

  return isDark && cfg.dark ? cfg.dark : cfg.src
}

function applyImages(root = document) {
  if (!isDOM) {
    return
  }

  const elements = getElements(root, '[data-image]')

  elements.forEach((img) => {
    const cfg = imageMap[img.dataset.image]

    if (!cfg) {
      return
    }

    const src = resolveImage(cfg)

    if (!src) {
      return
    }

    if (img.getAttribute('src') !== src) {
      img.setAttribute('src', src)
    }

    if (cfg.srcset) {
      img.srcset = cfg.srcset
    }

    if (cfg.sizes) {
      img.sizes = cfg.sizes
    }
  })
}

// --------------------------------------------------
// LINKS
// --------------------------------------------------

function applyLinks(root = document) {
  if (!isDOM) {
    return
  }

  const elements = getElements(root, '[data-link]')

  elements.forEach((el) => {
    const cfg = linkMap[el.dataset.link]

    if (!cfg?.href) {
      return
    }

    const href = String(cfg.href).trim()

    if (!href || href.startsWith('javascript:')) {
      return
    }

    el.href = href

    if (cfg.target) {
      el.target = cfg.target
    }

    if (cfg.rel) {
      el.rel = cfg.rel
    } else if (el.target === '_blank') {
      el.rel = 'noopener noreferrer'
    }

    if (cfg.download) {
      el.setAttribute(
        'download',
        cfg.download === true ? '' : cfg.download
      )
    }
  })
}

// --------------------------------------------------
<<<<<<< HEAD
// ICON RESOLVER (MASK vs COLOR)
// --------------------------------------------------

function resolveIconSource(iconName) {
  if (!iconName) return null

  const cfg = iconMap[iconName]
  if (!cfg) return null

  // 1. Compatibilidade com String simples (padrão: MASK)
  if (typeof cfg === 'string') {
    return {
      src: cfg,
      mode: 'mask',
    }
  }

  // 2. Configuração via Objeto
  if (typeof cfg === 'object') {
    let src = cfg.src || cfg.url || ''

    // Tratamento caso o objeto tenha variação por tema (light / dark)
    if (typeof src === 'object') {
      const theme = getTheme()
      src = theme === 'dark' ? src.dark : src.light
    }

    if (!src) return null

    return {
      src,
      mode: cfg.mode === 'color' ? 'color' : 'mask',
    }
  }

  return null
}

// --------------------------------------------------
// ICON SYSTEM (SSR SAFE CUSTOM ELEMENT)
=======
// ICON SYSTEM
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
// --------------------------------------------------

if (isBrowser && typeof HTMLElement !== 'undefined') {
  class IconElement extends HTMLElement {
    connectedCallback() {
      if (!isDOM) {
        return
      }

      this.render()
    }

    render() {
<<<<<<< HEAD
      const iconName = this.dataset.icon
      if (!iconName) return

      const resolved = resolveIconSource(iconName)
      if (!resolved) return

      // Limpa imagem interna anterior se existir
      const existingImg = this.querySelector(
        ':scope > img.nexo-icon'
      )
      if (existingImg) {
        existingImg.remove()
      }

      if (resolved.mode === 'color') {
        // MODO COLOR: Cria <img> interno para manter cores e gradientes
        this.setAttribute('data-icon-mode', 'color')
        this.style.setProperty('--icon-url', 'none')
        this.style.setProperty('mask', 'none')
        this.style.setProperty('-webkit-mask', 'none')
        this.style.setProperty('background', 'transparent')

        const img = document.createElement('img')
        img.className = 'nexo-icon'
        img.src = resolved.src
        img.alt = this.getAttribute('aria-label') || ''
        img.draggable = false
        img.style.display = 'block'
        img.style.width = '100%'
        img.style.height = '100%'
        img.style.objectFit = 'contain'
        img.style.pointerEvents = 'none'

        this.appendChild(img)
      } else {
        // MODO MASK: Utiliza máscara CSS para alteração de cor via CSS / currentColor
        this.setAttribute('data-icon-mode', 'mask')
        this.style.removeProperty('background')
        this.style.removeProperty('mask')
        this.style.removeProperty('-webkit-mask')
        this.style.setProperty(
          '--icon-url',
          `url("${resolved.src}")`
        )
      }
=======
      const cfg = iconMap[this.dataset.icon]

      if (!cfg) {
        return
      }

      const src = typeof cfg === 'string' ? cfg : cfg.src

      if (!src) {
        return
      }

      this.dataset.src = src

      this.style.setProperty('--icon-url', `url("${src}")`)
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
    }
  }

  if (!customElements.get('my-icon')) {
    customElements.define('my-icon', IconElement)
  }
}

function applyIcons(root = document) {
  if (!isDOM) {
    return
  }

  const elements = getElements(root, 'my-icon[data-icon]')

  elements.forEach((el) => {
    if (typeof el.render === 'function') {
      el.render()
    }
  })
}

// --------------------------------------------------
// APPLY UNIFICADO
// --------------------------------------------------

export function applyAssets(root = document) {
  if (!isDOM) {
    return
  }

  applyImages(root)

  applyLinks(root)

  applyIcons(root)
}

// --------------------------------------------------
// OBSERVER SPA
// --------------------------------------------------

let assetsObserver = null

export function observeAssets(id = 'children') {
  if (!isDOM) {
    return
  }

  const el = document.getElementById(id)

  if (!el) {
    return
  }

  if (assetsObserver) {
    assetsObserver.disconnect()
  }

  assetsObserver = new MutationObserver(() => {
    applyAssets(el)
  })

  assetsObserver.observe(el, {
    childList: true,
    subtree: true,
  })

  /*
    Aplica uma vez imediatamente.

    Assim o observer não depende
    da próxima mutação para corrigir
    os assets existentes.
  */

  applyAssets(el)
}

// --------------------------------------------------
// REACTIVE SYSTEM
// --------------------------------------------------

let reactiveInitialized = false

function setupReactive() {
  if (!isBrowser || !isDOM || reactiveInitialized) {
    return
  }

  reactiveInitialized = true

  // ------------------------------------------------
  // RESIZE
  // ------------------------------------------------

  window.addEventListener(
    'resize',
<<<<<<< HEAD
    debounce(() => applyAssets(), 200)
  )

  const themeObs = new MutationObserver(() => applyAssets())
=======
    debounce(() => {
      applyAssets()
    }, 200)
  )

  // ------------------------------------------------
  // THEME
  // ------------------------------------------------
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3

  const themeObserver = new MutationObserver(() => {
    applyAssets()
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

// --------------------------------------------------
// INIT
// --------------------------------------------------

let initialized = false

export function initAssets() {
  if (!isDOM || initialized) {
    return
  }

  initialized = true

  /*
    Primeira aplicação.

    Mesmo que os mapas já tenham
    sido definidos anteriormente,
    os assets são aplicados.
  */

  applyAssets()

  observeAssets()

  setupReactive()
}

// --------------------------------------------------
// TOOLTIP SYSTEM
// --------------------------------------------------

if (isBrowser) {
  let tooltip = null

  let current = null

  let timer = null

  let pointerId = null

  let start = null

  const clear = () => {
    if (timer) {
      clearTimeout(timer)

      timer = null

      pointerId = null

      start = null
    }
  }

  const hide = () => {
    if (tooltip) {
      tooltip.remove()

      tooltip = null

      current = null
    }
  }

  const show = (el) => {
    if (!el) {
      return
    }

    tooltip?.remove()

    tooltip = document.createElement('div')

    tooltip.className = 'tooltip-global'

    tooltip.textContent = el.dataset.tooltip || ''

    document.body.appendChild(tooltip)

    const rect = el.getBoundingClientRect()

    tooltip.style.top = rect.top + 'px'

    tooltip.style.left = rect.left + rect.width / 2 + 'px'

    requestAnimationFrame(() => {
      tooltip?.classList.add('show')
    })

    current = el
  }

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') {
      return
    }

    const el = event.target.closest?.('[data-tooltip]')

    if (!el || el === current) {
      return
    }

    show(el)
  })

  document.addEventListener('pointerout', (event) => {
    if (event.pointerType === 'touch') {
      return
    }

    const el = event.target.closest?.('[data-tooltip]')

    if (!el || el !== current) {
      return
    }

    hide()
  })

  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'touch') {
        return
      }

      const el = event.target.closest?.('[data-tooltip]')

      if (!el) {
        return
      }

      start = {
        x: event.clientX,
        y: event.clientY,
      }

      pointerId = event.pointerId

      timer = setTimeout(() => {
        show(el)

        clear()
      }, 450)
    },
    {
      passive: true,
    }
  )

  document.addEventListener('pointermove', (event) => {
    if (!timer || event.pointerId !== pointerId || !start) {
      return
    }

    const dx = event.clientX - start.x

    const dy = event.clientY - start.y

    if (Math.hypot(dx, dy) > 10) {
      clear()
    }
  })

  document.addEventListener('pointerup', clear)

  document.addEventListener('pointercancel', clear)

  window.addEventListener('scroll', hide)

  window.addEventListener('resize', hide)
}
