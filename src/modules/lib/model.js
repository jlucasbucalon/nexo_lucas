// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { applyModelAppearance, initProps } from './props.js'

// --------------------------------------------------
// CACHE
// --------------------------------------------------

const loadedCss = new Set()

const loadedJs = new Set()

// --------------------------------------------------
// LOADING CACHE
// --------------------------------------------------

<<<<<<< HEAD
  // Coleta todas as classes contendo hífen
  root.querySelectorAll("[class*='-']").forEach((el) => {
    el.classList.forEach((c) => {
      if (c.includes('-')) classSet.add(c)
    })
  })
=======
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
//
// Regra: o ÚLTIMO segmento após o hífen é o nome do
// model, o resto é a categoria.
//
// "background-particles"
// -> category: "background"
// -> modelName: "particles"
//
// "back-color"
// -> category: "back"
// -> modelName: "color"
//
// Usada tanto para resolver a string "component" do
// JSON (padrão data-model) quanto para resolver o
// nome direto de uma classe (padrão legado por classe).
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
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3

  if (!cssPath) {
    return
  }

<<<<<<< HEAD
  // Função auxiliar para dividir apenas no primeiro hífen
  const parseComponent = (comp) => {
    const idx = comp.indexOf('-')
    if (idx === -1) return null
    const category = comp.slice(0, idx)
    const name = comp.slice(idx + 1)
    return category && name ? { category, name } : null
  }

  // Carregamento de CSS
  const cssPromises = components.map((comp) => {
    const parsed = parseComponent(comp)
    if (!parsed) return Promise.resolve()

    const { category, name } = parsed
    const cssPath = `${config.dirs.models}/${category}/${name}/styles.css`

    if (loadedCss.has(cssPath)) return Promise.resolve()

    return new Promise((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = cssPath

      link.onload = () => {
        loadedCss.add(cssPath)
        resolve()
      }

      // Resolve mesmo se der erro para não travar o Promise.all
      link.onerror = () => resolve()

      document.head.appendChild(link)
    })
  })

  // Carregamento de JS
  const jsPromises = components.map((comp) => {
    const parsed = parseComponent(comp)
    if (!parsed) return Promise.resolve()

    const { category, name } = parsed
    const jsPath = `${config.dirs.models}/${category}/${name}/script.js`

    if (loadedJs.has(jsPath)) {
      window.Components?.[comp]?.init?.()
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = jsPath
      script.defer = true

      script.onload = () => {
        loadedJs.add(jsPath)
        window.Components?.[comp]?.init?.()
        resolve()
      }

      script.onerror = () => resolve()

      document.body.appendChild(script)
    })
  })

  // Aguarda tanto os CSSs quanto os JSs serem baixados
  await Promise.all([...cssPromises, ...jsPromises])
=======
  if (loadedCss.has(cssPath)) {
    return
  }

  if (loadingCss.has(cssPath)) {
    return loadingCss.get(cssPath)
  }

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

  if (loadedJs.has(jsPath)) {
    initializeModel(category, modelName, elements)

    return
  }

  if (loadingJs.has(jsPath)) {
    await loadingJs.get(jsPath)

    initializeModel(category, modelName, elements)

    return
  }

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
// GET MODELS CONFIG
// --------------------------------------------------
//
// Configuração dos models vem do JSON do cliente.
// --------------------------------------------------

function getModelsConfig() {
  if (!isBrowser) {
    return {}
  }

  return window.__nexoClientConfig?.models || {}
}

// --------------------------------------------------
// RESOLVE MODEL ENTRY
// --------------------------------------------------
//
// Recebe a KEY usada em data-model:
//
// data-model="background"
//
// E resolve:
//
// models.background.component
//
// Exemplo:
//
// "background-particles"
// -> background / particles
// --------------------------------------------------

function resolveModelEntry(key) {
  const entry = getModelsConfig()[key]

  if (!entry || typeof entry.component !== 'string') {
    return null
  }

  return resolveModelComponent(entry.component)
}

// --------------------------------------------------
// FIND DATA-MODEL ELEMENTS
// --------------------------------------------------

function findDataModelElements(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return []
  }

  const elements = []

  if (
    root.nodeType === 1 &&
    root.hasAttribute?.('data-model')
  ) {
    elements.push(root)
  }

  root
    .querySelectorAll('[data-model]')
    .forEach((element) => {
      elements.push(element)
    })

  return elements
}

// --------------------------------------------------
// FIND CLASS MODEL ELEMENTS
// --------------------------------------------------
//
// Padrão legado:
//
// class="model background-particles"
// --------------------------------------------------

function findClassModelElements(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return []
  }

  const elements = []

  if (
    root.nodeType === 1 &&
    root.classList?.contains('model')
  ) {
    elements.push(root)
  }

  root.querySelectorAll('.model').forEach((element) => {
    elements.push(element)
  })

  return elements
}

// --------------------------------------------------
// ADD MODEL
// --------------------------------------------------

function addModel(models, resolved, element) {
  const mapKey = `${resolved.category}/${resolved.modelName}`

  if (!models.has(mapKey)) {
    models.set(mapKey, {
      category: resolved.category,

      modelName: resolved.modelName,

      elements: [],
    })
  }

  models.get(mapKey).elements.push(element)
}

// --------------------------------------------------
// FIND MODELS
// --------------------------------------------------

function findModels(root) {
  const models = new Map()

  // ------------------------------------------------
  // DATA-MODEL
  // ------------------------------------------------

  const dataModelElements = findDataModelElements(root)

  for (const element of dataModelElements) {
    const key = element.dataset.model

    if (!key) {
      continue
    }

    const resolved = resolveModelEntry(key)

    if (!resolved) {
      console.warn(
        `[NEXO] Model "${key}" não encontrado ou "component" inválido na configuração do cliente.`
      )

      continue
    }

    // ----------------------------------------------
    // CSS COMPATIBILITY
    // ----------------------------------------------

    const cssClassName = `${resolved.category}-${resolved.modelName}`

    if (!element.classList.contains(cssClassName)) {
      element.classList.add(cssClassName)
    }

    addModel(models, resolved, element)
  }

  // ------------------------------------------------
  // LEGACY CLASS
  // ------------------------------------------------

  const classModelElements = findClassModelElements(root)

  for (const element of classModelElements) {
    if (element.hasAttribute('data-model')) {
      continue
    }

    const classes = [...element.classList]

    for (const cls of classes) {
      if (cls === 'model') {
        continue
      }

      const resolved = resolveModelComponent(cls)

      if (!resolved) {
        continue
      }

      addModel(models, resolved, element)
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

  // ------------------------------------------------
  // PROPS / THEME OBSERVER
  // ------------------------------------------------

  initProps()

  // ------------------------------------------------
  // APPEARANCE
  // ------------------------------------------------

  const dataModelElements = findDataModelElements(root)

  for (const element of dataModelElements) {
    try {
      applyModelAppearance(element)
    } catch (error) {
      console.warn(
        '[NEXO] Erro ao aplicar appearance do model.',
        error
      )
    }
  }

  // ------------------------------------------------
  // FIND MODELS
  // ------------------------------------------------

  const models = findModels(root)

  if (!models.length) {
    return
  }

  // ------------------------------------------------
  // LOAD CSS
  // ------------------------------------------------

  await Promise.all(
    models.map(async ({ category, modelName }) => {
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
>>>>>>> 96ab0f684d8df819070d489b6be605eae48a28f3
}
