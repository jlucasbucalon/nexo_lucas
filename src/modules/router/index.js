// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { loadPage } from './loader.js'

import { handleNavigation } from './navigation.js'

// --------------------------------------------------
// CREATE ROUTER
// --------------------------------------------------

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
          },
        })
      )

      return
    }

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
          },
        })
      )
    }
  }

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
}
