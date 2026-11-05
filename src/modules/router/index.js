// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { loadPage } from './loader.js'

import { handleNavigation } from './navigation.js'

// --------------------------------------------------
// CREATE ROUTER
// --------------------------------------------------

<<<<<<< HEAD
export function createRouter({ childrens, config, root }) {
  // --------------------------------------------------
  // RESOLVE ROUTE
  // --------------------------------------------------

  async function resolveRoute() {
    // --------------------------------------------------
    // HASH
    // --------------------------------------------------

    let hash = window.location.hash

    // --------------------------------------------------
    // DEFAULT ROUTE
    // --------------------------------------------------

    if (!hash) {
      window.location.replace(`#${config.pageInit}`)

      return
    }

    // --------------------------------------------------
    // INVALID HASH
    // --------------------------------------------------

    if (!hash.startsWith('#/')) {
      return
    }

    // --------------------------------------------------
    // PATH
    // --------------------------------------------------

    const path = hash.slice(1)

    // --------------------------------------------------
    // MATCH ROUTE
    // --------------------------------------------------

    const children = childrens.find((route) =>
      route.path.test(path)
    )

    // --------------------------------------------------
    // NOT FOUND
    // --------------------------------------------------

    if (!children) {
      root.innerHTML = '<p>Página não encontrada.</p>'

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            container: root,
            path,
            error: true,
=======
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
      if (!route || typeof route.href !== 'string') {
        return false
      }

      return route.href === hash
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
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
          },
        })
      )

      return
    }

<<<<<<< HEAD
    // --------------------------------------------------
    // LOAD PAGE
    // --------------------------------------------------

    try {
      await loadPage(children.page, root)

      // --------------------------------------------------
      // PAGE LOADED
      // --------------------------------------------------

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            container: root,
            page: children.page,
            path,
            error: false,
          },
        })
      )
    } catch (error) {
      // --------------------------------------------------
      // ERROR
      // --------------------------------------------------

      console.error(
        '[Router] Falha ao carregar página:',
        error
      )

      root.innerHTML = '<p>Erro ao carregar a página.</p>'

      // --------------------------------------------------
      // PAGE LOAD FINISHED WITH ERROR
      // --------------------------------------------------

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            container: root,
            page: children.page,
            path,
            error: true,
=======
    // ----------------------------------------------
    // VALIDATE HREF
    // ----------------------------------------------

    if (
      typeof children.href !== 'string' ||
      !children.href.trim()
    ) {
      console.error(
        `[SPA] A rota "${path}" não possui um href definido.`
      )

      root.innerHTML = `
        <p>
          Erro: rota não definida.
        </p>
      `

      document.dispatchEvent(
        new CustomEvent('spa:error', {
          detail: {
            client,
            page: path,
            root,
            error: new Error(
              `A rota "${path}" não possui um href definido.`
            ),
          },
        })
      )

      return
    }

    // ----------------------------------------------
    // PAGE PATH
    // ----------------------------------------------

    const pagePath =
      path === '/home' ? '/pages/home' : `/pages${path}`

    // ----------------------------------------------
    // LOAD PAGE
    // ----------------------------------------------

    try {
      await loadPage({
        pagePath,
        root,
        client,

        // ------------------------------------------
        // PAGE CONFIGURATION
        // ------------------------------------------

        page: children,
      })
    } catch (error) {
      console.error('[SPA] Erro ao carregar página:', error)

      document.dispatchEvent(
        new CustomEvent('spa:error', {
          detail: {
            client,
            page: pagePath,
            root,
            error,
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
          },
        })
      )
    }
  }

<<<<<<< HEAD
  // --------------------------------------------------
  // INIT
  // --------------------------------------------------

  async function init() {
    // --------------------------------------------------
    // NAVIGATION
    // --------------------------------------------------

    handleNavigation(resolveRoute)

    // --------------------------------------------------
    // HASH CHANGE
    // --------------------------------------------------

    window.addEventListener('hashchange', resolveRoute)

    // --------------------------------------------------
    // FIRST ROUTE
    // --------------------------------------------------

    await resolveRoute()
  }

  // --------------------------------------------------
  // PUBLIC API
  // --------------------------------------------------

  return {
    init,
  }
=======
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
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
}
