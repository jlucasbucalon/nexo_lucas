// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { loadPage } from './loader.js'

import { handleNavigation } from './navigation.js'

// --------------------------------------------------
// CREATE ROUTER
// --------------------------------------------------

export function createRouter({
  childrens = [],
  config = {},
  root,
  client,
}) {
  // ------------------------------------------------
  // RESOLVE ROUTE
  // ------------------------------------------------

  async function resolveRoute() {
    if (typeof window === 'undefined' || !window.location) {
      return
    }

    if (!root) {
      console.error(
        '[SPA] Root da aplicação não encontrado.'
      )

      return
    }

    if (!client) {
      console.error(
        '[SPA] Cliente da aplicação não informado.'
      )

      return
    }

    // ----------------------------------------------
    // HASH
    // ----------------------------------------------

    let hash = window.location.hash

    // ----------------------------------------------
    // INITIAL ROUTE
    // ----------------------------------------------

    if (!hash) {
      const initial = config?.pageInit || '/home'

      const normalized = initial.startsWith('/')
        ? initial
        : `/${initial}`

      hash = `#${normalized}`

      // --------------------------------------------
      // DEFINE HASH SEM RECARREGAR A PÁGINA
      // --------------------------------------------

      window.history.replaceState(null, '', hash)
    }

    // ----------------------------------------------
    // INVALID HASH
    // ----------------------------------------------

    if (!hash.startsWith('#/')) {
      return
    }

    // ----------------------------------------------
    // PATH
    // ----------------------------------------------

    const path = hash.slice(1)

    // ----------------------------------------------
    // FIND ROUTE
    // ----------------------------------------------

    const children = childrens.find((route) => {
      if (!route?.path) {
        return false
      }

      return route.path.test(path)
    })

    // ----------------------------------------------
    // NOT FOUND
    // ----------------------------------------------

    if (!children) {
      root.innerHTML = `
        <p>
          Página não encontrada.
        </p>
      `

      console.warn(`[SPA] Rota não encontrada: ${path}`)

      document.dispatchEvent(
        new CustomEvent('spa:error', {
          detail: {
            client,
            page: path,
            root,
            error: new Error(
              `Rota não encontrada: ${path}`
            ),
          },
        })
      )

      return
    }

    // ----------------------------------------------
    // VALIDATE PAGE
    // ----------------------------------------------

    if (!children.page) {
      console.error(
        `[SPA] A rota "${path}" não possui uma página definida.`
      )

      root.innerHTML = `
        <p>
          Erro: página da rota não definida.
        </p>
      `

      document.dispatchEvent(
        new CustomEvent('spa:error', {
          detail: {
            client,
            page: path,
            root,
            error: new Error(
              `A rota "${path}" não possui uma página definida.`
            ),
          },
        })
      )

      return
    }

    // ----------------------------------------------
    // LOAD PAGE
    // ----------------------------------------------

    try {
      await loadPage({
        pagePath: children.page,
        root,
        client,
      })
    } catch (error) {
      console.error('[SPA] Erro ao carregar página:', error)

      document.dispatchEvent(
        new CustomEvent('spa:error', {
          detail: {
            client,
            page: children.page,
            root,
            error,
          },
        })
      )
    }
  }

  // ------------------------------------------------
  // INIT
  // ------------------------------------------------

  function init() {
    // ----------------------------------------------
    // VALIDATE
    // ----------------------------------------------

    if (
      typeof window === 'undefined' ||
      typeof document === 'undefined'
    ) {
      return
    }

    // ----------------------------------------------
    // NAVIGATION HANDLER
    // ----------------------------------------------

    handleNavigation(resolveRoute)

    // ----------------------------------------------
    // HASH CHANGE
    // ----------------------------------------------

    window.addEventListener('hashchange', resolveRoute)

    // ----------------------------------------------
    // INITIAL ROUTE
    // ----------------------------------------------

    resolveRoute()
  }

  // ------------------------------------------------
  // API
  // ------------------------------------------------

  return {
    init,
    resolveRoute,
  }
}
