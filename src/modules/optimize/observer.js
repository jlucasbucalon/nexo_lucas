import { loadCSS, loadJS } from './assets.js'

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// MODEL RESOLVER
// --------------------------------------------------

function resolveClassModel(cls) {
  if (typeof cls !== 'string' || !cls.includes('-')) {
    return null
  }

  const cleanClass = cls.trim()

  if (!cleanClass) {
    return null
  }

  const parts = cleanClass.split('-')

  if (parts.length < 2) {
    return null
  }

  const name = parts.pop()

  const category = parts.join('-')

  if (!category || !name) {
    return null
  }

  return {
    category,
    name,
  }
}

// --------------------------------------------------
// CHECK RESOURCE
// --------------------------------------------------

async function resourceExists(path) {
  if (!isBrowser || !path) {
    return false
  }

  // ------------------------------------------------
  // TRY HEAD
  // ------------------------------------------------

  try {
    const response = await fetch(path, {
      method: 'HEAD',
      cache: 'no-store',
    })

    if (response.ok) {
      return true
    }
  } catch {
    // Continue with GET fallback
  }

  // ------------------------------------------------
  // TRY GET
  // ------------------------------------------------

  try {
    const response = await fetch(path, {
      method: 'GET',
      cache: 'no-store',
    })

    return response.ok
  } catch {
    return false
  }
}

// --------------------------------------------------
// MODEL COMPONENT
// --------------------------------------------------

function getModelComponent(category, name) {
  if (!isBrowser) {
    return null
  }

  const fullName = `${category}/${name}`

  // ------------------------------------------------
  // SLASH FORMAT
  // ------------------------------------------------

  const slashComponent = window.Components?.[fullName]

  if (
    slashComponent &&
    typeof slashComponent.init === 'function'
  ) {
    return slashComponent
  }

  // ------------------------------------------------
  // HYPHEN FORMAT
  // ------------------------------------------------

  const hyphenComponent =
    window.Components?.[`${category}-${name}`]

  if (
    hyphenComponent &&
    typeof hyphenComponent.init === 'function'
  ) {
    return hyphenComponent
  }

  // ------------------------------------------------
  // NESTED FORMAT
  // ------------------------------------------------

  const categoryComponent =
    window.Components?.[category]?.[name]

  if (
    categoryComponent &&
    typeof categoryComponent.init === 'function'
  ) {
    return categoryComponent
  }

  return null
}

// --------------------------------------------------
// MODEL LOADER
// --------------------------------------------------

async function loadClassModel(el, cls) {
  const model = resolveClassModel(cls)

  if (!model) {
    return
  }

  const { category, name } = model

  const base =
    `/src/components/models/` + `${category}/` + `${name}`

  const css = `${base}/styles.css`

  const js = `${base}/script.js`

  try {
    // ----------------------------------------------
    // CHECK CSS
    // ----------------------------------------------

    const cssExists = await resourceExists(css)

    // ----------------------------------------------
    // CHECK JS
    // ----------------------------------------------

    const jsExists = await resourceExists(js)

    // ----------------------------------------------
    // MODEL DOES NOT EXIST
    // ----------------------------------------------

    if (!cssExists && !jsExists) {
      return
    }

    // ----------------------------------------------
    // LOAD CSS
    // ----------------------------------------------

    if (cssExists) {
      await loadCSS(css)
    }

    // ----------------------------------------------
    // LOAD JS
    // ----------------------------------------------

    if (jsExists) {
      await loadJS(js)
    }

    // ----------------------------------------------
    // GET COMPONENT
    // ----------------------------------------------

    const component = getModelComponent(category, name)

    if (!component) {
      console.warn(
        `[NEXO] Model "${category}/${name}" foi encontrado, mas não possui componente registrado.`
      )

      return
    }

    // ----------------------------------------------
    // INITIALIZE MODEL
    // ----------------------------------------------

    await component.init(el)
  } catch (error) {
    console.warn(
      `[NEXO] Erro ao carregar model "${category}/${name}".`,
      error
    )
  }
}

// --------------------------------------------------
// LAZY MODULE
// --------------------------------------------------

async function loadLazyModule(el) {
  if (!el || !el.dataset?.lazy) {
    return
  }

  const path = el.dataset.lazy

  if (!path) {
    return
  }

  try {
    const module = await import(path)

    if (module && typeof module.init === 'function') {
      await module.init(el)
    }
  } catch (error) {
    console.warn(
      `[NEXO] Erro ao carregar módulo lazy "${path}".`,
      error
    )
  }
}

// --------------------------------------------------
// OBSERVER
// --------------------------------------------------

export function createObserver() {
  if (
    !isDOM ||
    typeof IntersectionObserver === 'undefined'
  ) {
    return null
  }

  return new IntersectionObserver(async (entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue
      }

      const el = entry.target

      // ------------------------------------------
      // MODELS POR CLASS
      // ------------------------------------------

      for (const cls of el.classList) {
        await loadClassModel(el, cls)
      }

      // ------------------------------------------
      // LAZY MODULE
      // ------------------------------------------

      await loadLazyModule(el)

      // ------------------------------------------
      // STOP OBSERVING
      // ------------------------------------------

      obs.unobserve(el)
    }
  })
}
