// --------------------------------------------------
// CACHE
// --------------------------------------------------

const loadedCss = new Set()

const loadedJs = new Set()

// --------------------------------------------------
// LOADING CACHE
// --------------------------------------------------

const loadingCss = new Map()

const loadingJs = new Map()

// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// VALID MODEL NAME
// --------------------------------------------------

function normalizeModelName(modelName) {
  if (typeof modelName !== 'string') {
    return null
  }

  const cleanName = modelName.trim().replace(/\s+/g, '')

  if (!cleanName) {
    return null
  }

  return cleanName
}

// --------------------------------------------------
// RESOLVE MODEL COMPONENT
// --------------------------------------------------

function resolveModelComponent(component) {
  const normalized = normalizeModelName(component)

  if (!normalized) {
    return null
  }

  const parts = normalized.split('-')

  if (parts.length < 2) {
    return null
  }

  const modelName = parts.pop()

  const category = parts.join('-')

  if (!category || !modelName) {
    return null
  }

  return {
    category,
    modelName,
  }
}

// --------------------------------------------------
// RESOLVE MODEL PATH
// --------------------------------------------------

function resolveModelPath(category, modelName, file) {
  const normalizedCategory = normalizeModelName(category)

  const normalizedModel = normalizeModelName(modelName)

  if (!normalizedCategory || !normalizedModel || !file) {
    return null
  }

  return (
    `/src/components/models/` +
    `${normalizedCategory}/` +
    `${normalizedModel}/` +
    `${file}`
  )
}

// --------------------------------------------------
// LOAD CSS
// --------------------------------------------------

async function loadCss(category, modelName) {
  if (!isDOM || !category || !modelName) {
    return
  }

  const cssPath = resolveModelPath(
    category,
    modelName,
    'styles.css'
  )

  if (!cssPath) {
    return
  }

  // ------------------------------------------------
  // ALREADY LOADED
  // ------------------------------------------------

  if (loadedCss.has(cssPath)) {
    return
  }

  // ------------------------------------------------
  // ALREADY LOADING
  // ------------------------------------------------

  if (loadingCss.has(cssPath)) {
    return loadingCss.get(cssPath)
  }

  // ------------------------------------------------
  // CREATE LOAD
  // ------------------------------------------------

  const promise = new Promise((resolve) => {
    const existing = document.querySelector(
      `link[rel="stylesheet"][href="${cssPath}"]`
    )

    if (existing) {
      loadedCss.add(cssPath)
      resolve()
      return
    }

    const link = document.createElement('link')

    link.rel = 'stylesheet'

    link.href = cssPath

    let finished = false

    const done = (success) => {
      if (finished) {
        return
      }

      finished = true

      if (success) {
        loadedCss.add(cssPath)
      }

      resolve()
    }

    link.onload = () => {
      done(true)
    }

    link.onerror = () => {
      console.warn(
        `[NEXO] Não foi possível carregar CSS do model "${category}/${modelName}": ${cssPath}`
      )

      done(false)
    }

    document.head.appendChild(link)
  })

  loadingCss.set(cssPath, promise)

  try {
    await promise
  } finally {
    loadingCss.delete(cssPath)
  }
}

// --------------------------------------------------
// LOAD JS
// --------------------------------------------------

async function loadJs(category, modelName, elements = []) {
  if (!isDOM || !category || !modelName) {
    return
  }

  const jsPath = resolveModelPath(
    category,
    modelName,
    'script.js'
  )

  if (!jsPath) {
    return
  }

  // ------------------------------------------------
  // ALREADY LOADED
  // ------------------------------------------------

  if (loadedJs.has(jsPath)) {
    initializeModel(category, modelName, elements)

    return
  }

  // ------------------------------------------------
  // ALREADY LOADING
  // ------------------------------------------------

  if (loadingJs.has(jsPath)) {
    await loadingJs.get(jsPath)

    initializeModel(category, modelName, elements)

    return
  }

  // ------------------------------------------------
  // CREATE LOAD
  // ------------------------------------------------

  const promise = new Promise((resolve) => {
    const script = document.createElement('script')

    script.src = jsPath

    script.defer = true

    let finished = false

    const done = (success) => {
      if (finished) {
        return
      }

      finished = true

      if (success) {
        loadedJs.add(jsPath)
      }

      resolve()
    }

    script.onload = () => {
      done(true)
    }

    script.onerror = (error) => {
      console.warn(
        `[NEXO] Não foi possível carregar model "${category}/${modelName}"`,
        error
      )

      done(false)
    }

    document.body.appendChild(script)
  })

  loadingJs.set(jsPath, promise)

  try {
    await promise

    initializeModel(category, modelName, elements)
  } finally {
    loadingJs.delete(jsPath)
  }
}

// --------------------------------------------------
// GET MODEL COMPONENT
// --------------------------------------------------

function getModelComponent(category, modelName) {
  if (!isBrowser) {
    return null
  }

  const fullName = `${category}/${modelName}`

  const slashComponent = window.Components?.[fullName]

  if (
    slashComponent &&
    typeof slashComponent.init === 'function'
  ) {
    return slashComponent
  }

  const hyphenName = `${category}-${modelName}`

  const hyphenComponent = window.Components?.[hyphenName]

  if (
    hyphenComponent &&
    typeof hyphenComponent.init === 'function'
  ) {
    return hyphenComponent
  }

  const categoryComponent =
    window.Components?.[category]?.[modelName]

  if (
    categoryComponent &&
    typeof categoryComponent.init === 'function'
  ) {
    return categoryComponent
  }

  return null
}

// --------------------------------------------------
// INITIALIZE MODEL
// --------------------------------------------------

function initializeModel(
  category,
  modelName,
  elements = []
) {
  if (!isBrowser) {
    return
  }

  try {
    const component = getModelComponent(category, modelName)

    if (!component) {
      console.warn(
        `[NEXO] Model "${category}/${modelName}" não foi registrado.`
      )

      return
    }

    const targets = Array.isArray(elements)
      ? elements
      : [elements]

    for (const element of targets) {
      if (!element) {
        continue
      }

      component.init(element)
    }
  } catch (error) {
    console.warn(
      `[NEXO] Erro ao inicializar model "${category}/${modelName}"`,
      error
    )
  }
}

// --------------------------------------------------
// FIND MODEL ELEMENTS
// --------------------------------------------------

function findModelElements(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return []
  }

  const elements = []

  // ------------------------------------------------
  // ROOT
  // ------------------------------------------------

  if (
    root.nodeType === 1 &&
    root.classList?.contains('model')
  ) {
    elements.push(root)
  }

  // ------------------------------------------------
  // DESCENDANTS
  // ------------------------------------------------

  root.querySelectorAll('.model').forEach((element) => {
    elements.push(element)
  })

  return elements
}

// --------------------------------------------------
// FIND MODELS
// --------------------------------------------------

function findModels(root) {
  const elements = findModelElements(root)

  const models = new Map()

  for (const element of elements) {
    const classes = [...element.classList]

    for (const cls of classes) {
      // --------------------------------------------
      // IGNORE MARKER
      // --------------------------------------------

      if (cls === 'model') {
        continue
      }

      // --------------------------------------------
      // RESOLVE MODEL
      // --------------------------------------------

      const resolved = resolveModelComponent(cls)

      if (!resolved) {
        continue
      }

      const key = `${resolved.category}/${resolved.modelName}`

      if (!models.has(key)) {
        models.set(key, {
          category: resolved.category,

          modelName: resolved.modelName,

          elements: [],
        })
      }

      const model = models.get(key)

      model.elements.push(element)
    }
  }

  return [...models.values()]
}

// --------------------------------------------------
// LOAD MODELS
// --------------------------------------------------

export async function loadModels(root = document) {
  if (!isBrowser || !isDOM) {
    return
  }

  console.log('[MODEL] ROOT:', root)

  const models = findModels(root)

  console.log('[MODEL] MODELS:', models)

  if (!models.length) {
    console.log('[MODEL] Nenhum model encontrado.')

    return
  }

  // ------------------------------------------------
  // LOAD CSS
  // ------------------------------------------------

  await Promise.all(
    models.map(async ({ category, modelName }) => {
      console.log(
        `[MODEL] Carregando CSS: ${category}/${modelName}`
      )

      try {
        await loadCss(category, modelName)
      } catch (error) {
        console.warn(
          `[NEXO] Erro ao carregar CSS do model "${category}/${modelName}"`,
          error
        )
      }
    })
  )

  // ------------------------------------------------
  // LOAD JS
  // ------------------------------------------------

  await Promise.all(
    models.map(
      async ({ category, modelName, elements }) => {
        console.log(
          `[MODEL] Carregando JS: ${category}/${modelName}`
        )

        try {
          await loadJs(category, modelName, elements)
        } catch (error) {
          console.warn(
            `[NEXO] Erro ao carregar JS do model "${category}/${modelName}"`,
            error
          )
        }
      }
    )
  )
}
