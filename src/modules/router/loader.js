// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { applyFade } from '../core/sheet.js'

import { reexecuteScripts } from './scripts.js'

import { updateHeadFromHTML } from './head.js'

// --------------------------------------------------
// RESOLVE PAGE URL
// --------------------------------------------------

function resolvePageUrl(client, pagePath) {
  if (!client) {
    throw new Error(
      '[SPA] Cliente da aplicação não informado.'
    )
  }

  if (!pagePath) {
    throw new Error(
      '[SPA] Caminho da página não informado.'
    )
  }

  // ----------------------------------------------
  // CLIENT
  // ----------------------------------------------

  let cleanClient = String(client).trim()

  // ----------------------------------------------
  // REMOVE LEADING / TRAILING SLASHES
  // ----------------------------------------------

  cleanClient = cleanClient
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  // ----------------------------------------------
  // VALIDATE CLIENT
  // ----------------------------------------------

  if (!cleanClient.startsWith('@')) {
    throw new Error(`[SPA] Cliente inválido: ${client}`)
  }

  // ----------------------------------------------
  // PAGE PATH
  // ----------------------------------------------

  let cleanPath = String(pagePath).trim()

  // ----------------------------------------------
  // REMOVE .html
  // ----------------------------------------------

  if (cleanPath.endsWith('.html')) {
    cleanPath = cleanPath.slice(0, -'.html'.length)
  }

  // ----------------------------------------------
  // REMOVE LEADING SLASHES
  // ----------------------------------------------

  cleanPath = cleanPath.replace(/^\/+/, '')

  // ----------------------------------------------
  // VALIDATE PAGE PATH
  // ----------------------------------------------

  if (!cleanPath) {
    throw new Error('[SPA] Caminho da página inválido.')
  }

  // ----------------------------------------------
  // BUILD URL
  // ----------------------------------------------

  return new URL(
    `/${cleanClient}/${cleanPath}.html`,
    document.baseURI
  ).href
}

// --------------------------------------------------
// LOAD PAGE
// --------------------------------------------------

export async function loadPage({ client, pagePath, root }) {
  // ------------------------------------------------
  // VALIDATION
  // ------------------------------------------------

  if (typeof document === 'undefined' || !root) {
    return false
  }

  try {
    // ----------------------------------------------
    // PAGE URL
    // ----------------------------------------------

    const pageUrl = resolvePageUrl(client, pagePath)

    console.log('[SPA] Carregando página:', pageUrl)

    // ----------------------------------------------
    // FETCH
    // ----------------------------------------------

    const res = await fetch(pageUrl, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ao carregar ${pageUrl}`
      )
    }

    // ----------------------------------------------
    // HTML
    // ----------------------------------------------

    const html = await res.text()

    // ----------------------------------------------
    // UPDATE HEAD
    // ----------------------------------------------

    updateHeadFromHTML(html, pagePath)

    // ----------------------------------------------
    // RENDER
    // ----------------------------------------------

    await applyFade(root, async () => {
      // ------------------------------------------
      // INSERT HTML
      // ------------------------------------------

      root.innerHTML = html

      // ------------------------------------------
      // EXECUTE PAGE SCRIPTS
      // ------------------------------------------

      await reexecuteScripts(root)

      // ------------------------------------------
      // PAGE LOADED EVENT
      // ------------------------------------------

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            client,
            page: pagePath,
            root,
          },
        })
      )
    })

    // ----------------------------------------------
    // SUCCESS
    // ----------------------------------------------

    return true
  } catch (err) {
    // ----------------------------------------------
    // ERROR
    // ----------------------------------------------

    console.error('[SPA] Erro ao carregar página:', err)

    root.innerHTML = `
      <p>
        Erro ao carregar página.
      </p>
    `

    // ----------------------------------------------
    // PAGE ERROR EVENT
    // ----------------------------------------------

    document.dispatchEvent(
      new CustomEvent('spa:error', {
        detail: {
          client,
          page: pagePath,
          root,
          error: err,
        },
      })
    )

    return false
  }
}
