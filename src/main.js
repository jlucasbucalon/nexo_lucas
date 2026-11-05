// ==================================================
// NEXO USER
// MAIN
// ==================================================

// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import {
  initAssets,
  applyAssets,
  setAssetMaps,
} from './modules/core/utils.js'

import {
  configureLoading,
  showLoading,
  hideLoading,
} from './modules/core/loading.js'

import { imageMap, linkMap, iconMap } from './assets.js'

import { childrens } from './path.js'

import { configureSheet } from './modules/core/sheet.js'

import { createApp } from './modules/lib/index.js'

import './modules/core/theme.js'

// ==================================================
// ROUTE MATCH
// ==================================================

export function matchRoute(url, childrens) {
  return childrens.find((r) => r.path.test(url))
}

// ==================================================
// CONFIG GLOBAL
// COMPARTILHÁVEL SSR / CLIENT
// ==================================================

export const config = {
  dirs: {
    layouts: '/components/layouts',
    models: '/components/models',
  },

  pageInit: '/home',
}

// ==================================================
// ANIMAÇÕES
// CLIENT ONLY
// ==================================================

export const animated = {
  scroll: {
    enabled: true,
    mode: 'smooth',

    custom: {
      ease: 0.4,
      stepMin: 1,
      stepMax: 60,
    },
  },

  fade: {
    enabled: true,
    duration: 300,
    useTranslate: true,
    translateValue: '5px',
  },
}

// ==================================================
// BOOTSTRAP CLIENT
// SPA HYDRATION
// ==================================================

async function bootstrapClient() {
  // ------------------------------------------------
  // SEGURANÇA SSR
  // ------------------------------------------------

  if (typeof window === 'undefined') {
    return
  }

  // ------------------------------------------------
  // LOADING
  // ------------------------------------------------

  configureLoading()

  showLoading()

  // ------------------------------------------------
  // ASSETS
  // ------------------------------------------------

  setAssetMaps({
    imageMap,
    linkMap,
    iconMap,
  })

  initAssets()

  // ------------------------------------------------
  // ANIMAÇÕES
  // ------------------------------------------------

  configureSheet(animated)

  // ------------------------------------------------
  // APP SPA
  // ------------------------------------------------

  const app = createApp({
    childrens,
    config,

    root:
      document.getElementById('children') ||
      document.getElementById('app'),
  })

  // ------------------------------------------------
  // PÓS-RENDER SPA
  // ------------------------------------------------
  //
  // IMPORTANTE:
  // Este listener é registrado ANTES
  // do mount para não perder o primeiro
  // spa:pageLoaded.
  // ------------------------------------------------

  document.addEventListener('spa:pageLoaded', (e) => {
    const container = e.detail?.container || document

    try {
      applyAssets(container)
    } catch (err) {
      console.warn('applyAssets falhou:', err)
    }
  })

  // ------------------------------------------------
  // APP READY
  // ------------------------------------------------
  //
  // Este evento significa que a inicialização
  // principal terminou.
  // ------------------------------------------------

  document.addEventListener(
    'nexo:appReady',
    () => {
      hideLoading()

      console.log('[Nexo] Aplicação pronta')
    },
    {
      once: true,
    }
  )

  // ------------------------------------------------
  // MOUNT
  // ------------------------------------------------

  try {
    await app.mount()
  } catch (err) {
    console.error('[Nexo] Falha ao iniciar aplicação:', err)

    hideLoading()
  }

  // ------------------------------------------------
  // CLIENT HYDRATED
  // ------------------------------------------------

  console.log('[SPA] Client hydrated ✅')
}

// ==================================================
// AUTO START
// CLIENT ONLY
// ==================================================

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
