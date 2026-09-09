// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { createRouter } from '../router/index.js'

import { initOptimize } from '../optimize/index.js'

import { loadModels } from './model.js'

import { loadAllComponents } from './layout.js'

// --------------------------------------------------
// CREATE APP
// --------------------------------------------------

export function createApp({
  childrens,
  config,
  root,
  client,
}) {
  return {
    // ----------------------------------------------
    // MOUNT
    // ----------------------------------------------

    mount() {
      if (!root) {
        console.error(
          '[NEXO] Root da aplicação não encontrado.'
        )

        return
      }

      // --------------------------------------------
      // CLIENT VALIDATION
      // --------------------------------------------

      if (!client) {
        console.error(
          '[NEXO] Cliente da aplicação não informado.'
        )

        return
      }

      // --------------------------------------------
      // OPTIMIZATION
      // --------------------------------------------

      initOptimize()

      // --------------------------------------------
      // SPA EVENTS
      // --------------------------------------------

      document.addEventListener(
        'spa:pageLoaded',
        async (event) => {
          const container =
            event.detail?.root ||
            event.detail?.container ||
            root

          // ----------------------------------------
          // MODELS
          // ----------------------------------------

          try {
            await loadModels(container, config)
          } catch (error) {
            console.warn('[NEXO] loadModels falhou:', error)
          }

          // ----------------------------------------
          // COMPONENTS
          // ----------------------------------------

          try {
            await loadAllComponents(container)
          } catch (error) {
            console.warn(
              '[NEXO] loadAllComponents falhou:',
              error
            )
          }
        }
      )

      // --------------------------------------------
      // INITIAL MODELS
      // --------------------------------------------

      try {
        loadModels(document, config)
      } catch (error) {
        console.warn(
          '[NEXO] loadModels inicial falhou:',
          error
        )
      }

      // --------------------------------------------
      // INITIAL COMPONENTS
      // --------------------------------------------

      try {
        loadAllComponents(document)
      } catch (error) {
        console.warn(
          '[NEXO] loadAllComponents inicial falhou:',
          error
        )
      }

      // --------------------------------------------
      // ROUTER
      // --------------------------------------------

      const router = createRouter({
        childrens,

        config,

        root,

        client,
      })

      // --------------------------------------------
      // START ROUTER
      // --------------------------------------------

      router.init()

      // --------------------------------------------
      // RETURN
      // --------------------------------------------

      return router
    },
  }
}
