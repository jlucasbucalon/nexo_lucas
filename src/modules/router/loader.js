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
  // ----------------------------------------------
  // VALIDATE CLIENT
  // ----------------------------------------------

  if (typeof client !== 'string' || !client.trim()) {
    throw new Error(
      '[SPA] Cliente da aplicação não informado.'
    )
  }

  // ----------------------------------------------
  // VALIDATE PAGE PATH
  // ----------------------------------------------

  if (typeof pagePath !== 'string' || !pagePath.trim()) {
    throw new Error(
      '[SPA] Caminho da página não informado.'
    )
  }

  // ----------------------------------------------
  // CLIENT
  // ----------------------------------------------

  let cleanClient = client.trim()

  cleanClient = cleanClient
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleanClient.startsWith('@')) {
    throw new Error(`[SPA] Cliente inválido: ${client}`)
  }

  // ----------------------------------------------
  // PAGE PATH
  // ----------------------------------------------

  let cleanPath = pagePath.trim()

  // ----------------------------------------------
  // REMOVE HASH
  // ----------------------------------------------

  if (cleanPath.startsWith('#')) {
    cleanPath = cleanPath.slice(1)
  }

  // ----------------------------------------------
  // REMOVE LEADING SLASHES
  // ----------------------------------------------

  cleanPath = cleanPath.replace(/^\/+/, '')

  // ----------------------------------------------
  // REMOVE PAGES DIRECTORY
  // ----------------------------------------------

  if (cleanPath.startsWith('pages/')) {
    cleanPath = cleanPath.slice('pages/'.length)
  }

  // ----------------------------------------------
  // REMOVE LEGACY PAGE DIRECTORY
  // ----------------------------------------------

  if (cleanPath.startsWith('page/')) {
    cleanPath = cleanPath.slice('page/'.length)
  }

  // ----------------------------------------------
  // REMOVE .HTML
  // ----------------------------------------------

  if (cleanPath.endsWith('.html')) {
    cleanPath = cleanPath.slice(0, -'.html'.length)
  }

  // ----------------------------------------------
  // VALIDATE PAGE PATH
  // ----------------------------------------------

  if (!cleanPath) {
    throw new Error('[SPA] Caminho da página inválido.')
  }

  // ----------------------------------------------
  // HOME
  // ----------------------------------------------

  if (cleanPath === 'home') {
    return new URL(
      `/${cleanClient}/home.html`,
      document.baseURI
    ).href
  }

  // ----------------------------------------------
  // SHARED PAGES
  // ----------------------------------------------

  return new URL(
    `/client/pages/${cleanPath}.html`,
    document.baseURI
  ).href
}

// --------------------------------------------------
// LOAD PAGE
// --------------------------------------------------

export async function loadPage({
  client,
  pagePath,
  root,
  page = null,
}) {
  // ----------------------------------------------
  // VALIDATION
  // ----------------------------------------------

  if (typeof document === 'undefined' || !root) {
    return false
  }

  try {
    // --------------------------------------------
    // PAGE URL
    // --------------------------------------------

    const pageUrl = resolvePageUrl(client, pagePath)

    console.log('[SPA] Carregando página:', pageUrl)

    // --------------------------------------------
    // FETCH
    // --------------------------------------------

    const res = await fetch(pageUrl, {
      cache: 'no-store',
    })

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ao carregar ${pageUrl}`
      )
    }

    // --------------------------------------------
    // HTML
    // --------------------------------------------

    const html = await res.text()

    // --------------------------------------------
    // UPDATE HEAD
    // --------------------------------------------

    updateHeadFromHTML(html, pagePath)

    // --------------------------------------------
    // RENDER
    // --------------------------------------------

    await applyFade(root, async () => {
      // ----------------------------------------
      // INSERT HTML
      // ----------------------------------------

      root.innerHTML = html
      reexecuteScripts(root)

      // ----------------------------------------
      // EXECUTE PAGE SCRIPTS
      // ----------------------------------------

      await reexecuteScripts(root)

      // ----------------------------------------
      // PAGE LOADED EVENT
      // ----------------------------------------

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            client,
            page: pagePath,

            root,

            // --------------------------------
            // NORMALIZED PAGE
            // --------------------------------

            page,
          },
        })
      )
    })
<<<<<<< HEAD
  } catch (err) {
    console.error(err)
    root.innerHTML = '<p>Erro ao carregar página</p>'
=======

    // --------------------------------------------
    // SUCCESS
    // --------------------------------------------

    return true
  } catch (err) {
    // --------------------------------------------
    // ERROR
    // --------------------------------------------

    console.error('[SPA] Erro ao carregar página:', err)

    root.innerHTML = `
      <p>
        Erro ao carregar página.
      </p>
    `

    // --------------------------------------------
    // PAGE ERROR EVENT
    // --------------------------------------------

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
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
  }
}
