// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import {
  initAssets,
  applyAssets,
  setAssetMaps,
} from '../src/modules/core/utils.js'

import { configureSheet } from '../src/modules/core/sheet.js'

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
// NORMALIZE PAGES
// --------------------------------------------------

function normalizePages(pages = []) {
  return pages
    .filter(
      (page) =>
        page &&
        typeof page.path === 'string' &&
        typeof page.page === 'string'
    )
    .map((page) => ({
      path: new RegExp(
        `^${page.path.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )}$`
      ),
      page: page.page,
    }))
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
  // PREVENT DUPLICATE BOOTSTRAP
  // ------------------------------------------------

  if (window.__nexoClientInitialized) {
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

    return
  }

  // ------------------------------------------------
  // LOAD CLIENT
  // ------------------------------------------------

  const clientConfig = await loadClientConfig()

  if (!clientConfig) {
    return
  }

  // ------------------------------------------------
  // CLIENT CONFIG
  // ------------------------------------------------

  window.__nexoClientConfig = clientConfig

  // ------------------------------------------------
  // CLIENT DATA
  // ------------------------------------------------

  const {
    client,
    pages = [],
    config = {},
    models = {},
    animations = {},
    assets = {},
  } = clientConfig

  // ------------------------------------------------
  // NORMALIZE
  // ------------------------------------------------

  const childrens = normalizePages(pages)

  const { imageMap, iconMap } = normalizeAssets(
    client,
    assets
  )

  // ------------------------------------------------
  // RUNTIME CONFIG
  // ------------------------------------------------
  //
  // Mantém "config" e "models"
  // separados no index.json,
  // mas entrega ambos ao runtime.
  //
  // Assim:
  //
  // config.pageInit
  // config.models
  //
  // ficam disponíveis para
  // router e model.js.
  // ------------------------------------------------

  const runtimeConfig = {
    ...config,
    models,
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

  app.mount()

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
