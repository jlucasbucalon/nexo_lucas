// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import {
  initAssets,
  applyAssets,
  setAssetMaps,
} from '../src/modules/core/utils.js'

import {
  showLoading,
  hideLoading,
} from '../src/modules/core/loading.js'

import { configureSheet } from '../src/modules/core/sheet.js'
import { updateHeadFromMeta } from '../src/modules/router/head.js'
import { createApp } from '../src/modules/lib/index.js'

// --------------------------------------------------
// THEME
// --------------------------------------------------

import '../src/modules/core/theme.js'

// --------------------------------------------------
// CLIENT
// --------------------------------------------------

async function loadClientConfig() {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return null
  }

  const pathname = window.location.pathname

  const match = pathname.match(/^\/(@[^/]+)/)

  if (!match) {
    console.error(
      '[NEXO] Não foi possível identificar o cliente pela URL.'
    )

    return null
  }

  const client = match[1]

  // ------------------------------------------------
  // JSON
  // ------------------------------------------------

  const configUrl = `/${client}/index.json`

  try {
    const response = await fetch(configUrl, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ao carregar ${configUrl}`
      )
    }

    const json = await response.json()

    console.log(
      `[NEXO] Configuração carregada: ${client}/index.json`
    )

    return {
      client,
      ...json,
    }
  } catch (error) {
    console.error(
      `[NEXO] Não foi possível carregar a configuração do cliente "${client}".`,
      error
    )

    return null
  }
}

// --------------------------------------------------
// PAGE PATH
// --------------------------------------------------

function resolvePagePath(href) {
  if (typeof href !== 'string' || !href.trim()) {
    return ''
  }

  let path = href.trim()

  // ----------------------------------------------
  // REMOVE HASH
  // ----------------------------------------------

  if (path.startsWith('#')) {
    path = path.slice(1)
  }

  // ----------------------------------------------
  // NORMALIZE SLASH
  // ----------------------------------------------

  if (!path.startsWith('/')) {
    path = `/${path}`
  }

  // ----------------------------------------------
  // HOME
  // ----------------------------------------------

  if (path === '/' || path === '/home') {
    return '/home'
  }

  // ----------------------------------------------
  // SHARED PAGES
  // ----------------------------------------------

  return path
}

// --------------------------------------------------
// NORMALIZE PAGES
// --------------------------------------------------

function normalizePages(items = []) {
  if (!Array.isArray(items)) {
    return []
  }

  return (
    items

      // --------------------------------------------
      // SOMENTE ITENS DE PÁGINA
      // --------------------------------------------

      .filter((item) => {
        return (
          item &&
          item.type === 'link' &&
          item.navigation === 'page' &&
          typeof item.href === 'string' &&
          item.href.trim()
        )
      })

      // --------------------------------------------
      // NORMALIZA
      // --------------------------------------------

      .map((item) => {
        const href = item.href.trim()

        const page = resolvePagePath(href)

        if (!page) {
          return null
        }

        return {
          // ----------------------------------------
          // NAVBAR
          // ----------------------------------------

          type: item.type,

          href,

          tooltip:
            typeof item.tooltip === 'string'
              ? item.tooltip
              : '',

          icon: item.icon || null,

          navigation: item.navigation,

          position: Number.isFinite(Number(item.position))
            ? Number(item.position)
            : 999999,

          // ----------------------------------------
          // ROTA DA PÁGINA
          // ----------------------------------------

          page,

          // ----------------------------------------
          // COMPONENTES
          // ----------------------------------------

          components: Array.isArray(item.components)
            ? item.components
            : [],
        }
      })

      // --------------------------------------------
      // REMOVE INVALID
      // --------------------------------------------

      .filter(Boolean)

      // --------------------------------------------
      // ORDENAÇÃO
      // --------------------------------------------

      .sort((a, b) => {
        if (a.position !== b.position) {
          return a.position - b.position
        }

        return a.tooltip.localeCompare(b.tooltip, 'pt-BR')
      })
  )
}

// --------------------------------------------------
// NORMALIZE ASSETS
// --------------------------------------------------

function normalizeAssets(client, assets = {}) {
  const imageMap = {}
  const iconMap = {}

  // ------------------------------------------------
  // IMAGES
  // ------------------------------------------------

  for (const [name, image] of Object.entries(
    assets.images || {}
  )) {
    if (!image) {
      continue
    }

    const normalized = {
      ...image,
    }

    if (image.src) {
      normalized.src = `/${client}/constant/images/${image.src}`
    }

    if (image.dark) {
      normalized.dark = `/${client}/constant/images/${image.dark}`
    }

    if (image.set) {
      normalized.set = {
        ...image.set,
      }

      if (image.set.src) {
        normalized.set.src = `/${client}/constant/images/${image.set.src}`
      }

      if (image.set.dark) {
        normalized.set.dark = `/${client}/constant/images/${image.set.dark}`
      }
    }

    imageMap[name] = normalized
  }

  // ------------------------------------------------
  // ICONS
  // ------------------------------------------------

  for (const [name, icon] of Object.entries(
    assets.icons || {}
  )) {
    if (!icon) {
      continue
    }

    iconMap[name] = {
      ...icon,

      ...(icon.src && {
        src: `/${client}/constant/icons/${icon.src}`,
      }),
    }
  }

  return {
    imageMap,
    iconMap,
  }
}

// --------------------------------------------------
// BOOTSTRAP CLIENT
// --------------------------------------------------

async function bootstrapClient() {
  // ------------------------------------------------
  // SSR SAFETY
  // ------------------------------------------------

  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return
  }

  // ------------------------------------------------
  // SHOW LOADING
  // ------------------------------------------------

  showLoading()

  // ------------------------------------------------
  // PREVENT DUPLICATE BOOTSTRAP
  // ------------------------------------------------

  if (window.__nexoClientInitialized) {
    hideLoading()

    return
  }

  // ------------------------------------------------
  // ROOT
  // ------------------------------------------------

  const root =
    document.getElementById('children') ||
    document.getElementById('app')

  if (!root) {
    console.error(
      '[NEXO] Root da aplicação não encontrado.'
    )

    hideLoading()

    return
  }

  // ------------------------------------------------
  // LOAD CLIENT
  // ------------------------------------------------

  const clientConfig = await loadClientConfig()

  if (!clientConfig) {
    hideLoading()

    return
  }

  // ------------------------------------------------
  // PROFILE META
  // ------------------------------------------------

  updateHeadFromMeta(clientConfig.meta)

  // ------------------------------------------------
  // CLIENT CONFIG
  // ------------------------------------------------

  window.__nexoClientConfig = clientConfig

  // ------------------------------------------------
  // CLIENT DATA
  // ------------------------------------------------

  const {
    client,
    config = {},
    models = {},
    animations = {},
    assets = {},
    navbar = {},
  } = clientConfig

  // ------------------------------------------------
  // NAVBAR ITEMS
  // ------------------------------------------------

  const navbarProps = navbar?.props || {}

  const navbarItems = Array.isArray(navbarProps.items)
    ? navbarProps.items
    : []

  // ------------------------------------------------
  // NORMALIZE PAGES
  // ------------------------------------------------

  const childrens = normalizePages(navbarItems)

  // ------------------------------------------------
  // NORMALIZE ASSETS
  // ------------------------------------------------

  const { imageMap, iconMap } = normalizeAssets(
    client,
    assets
  )

  // ------------------------------------------------
  // RUNTIME CONFIG
  // ------------------------------------------------

  const runtimeConfig = {
    ...config,

    // ----------------------------------------------
    // MODELS
    // ----------------------------------------------

    models,

    // ----------------------------------------------
    // NAVBAR
    // ----------------------------------------------

    navbar: {
      ...navbar,

      props: {
        ...navbarProps,

        items: navbarItems,
      },
    },

    // ----------------------------------------------
    // PAGES
    // ----------------------------------------------

    pages: childrens,
  }

  // ------------------------------------------------
  // MARK INITIALIZATION
  // ------------------------------------------------

  window.__nexoClientInitialized = true

  // ------------------------------------------------
  // ASSETS
  // ------------------------------------------------

  setAssetMaps({
    imageMap,
    iconMap,
  })

  initAssets()

  // ------------------------------------------------
  // ANIMATIONS
  // ------------------------------------------------

  configureSheet(animations)

  // ------------------------------------------------
  // SPA PAGE LOADED
  // ------------------------------------------------

  function handlePageLoaded(event) {
    const container = event.detail?.root || root

    if (
      !container ||
      typeof container.querySelectorAll !== 'function'
    ) {
      return
    }

    // ----------------------------------------------
    // ASSETS
    // ----------------------------------------------

    try {
      applyAssets(container)
    } catch (error) {
      console.warn('[NEXO] applyAssets falhou:', error)
    }
  }

  document.addEventListener(
    'spa:pageLoaded',
    handlePageLoaded
  )

  // ------------------------------------------------
  // SPA READY
  // ------------------------------------------------

  function handleReady(event) {
    const container = event.detail?.root || root

    if (!container) {
      return
    }

    hideLoading()
  }

  document.addEventListener('spa:ready', handleReady)

  // ------------------------------------------------
  // APP SPA
  // ------------------------------------------------

  const app = createApp({
    childrens,
    config: runtimeConfig,
    root,
    client,
  })

  // ------------------------------------------------
  // MOUNT
  // ------------------------------------------------

  await app.mount()

  // ------------------------------------------------
  // READY
  // ------------------------------------------------

  console.log(`[NEXO] Client "${client}" hydrated ✅`)
}

// --------------------------------------------------
// AUTO START
// --------------------------------------------------

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      bootstrapClient,
      {
        once: true,
      }
    )
  } else {
    bootstrapClient()
  }
}
