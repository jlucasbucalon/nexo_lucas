// --------------------------------------------------
// IMPORTS
// --------------------------------------------------

import { loadModels } from './model.js'

import {
  renderProps,
  resolveComponentProps,
  applyComponentAppearance,
  initProps,
} from './props.js'

// --------------------------------------------------
// ENV DETECTION
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'
const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// CACHE
// --------------------------------------------------

const loadedStyles = new Set()
const loadedScripts = new Set()
const componentCache = new Map()

// --------------------------------------------------
// COMPONENT LOCK
// --------------------------------------------------

const componentLoading = new WeakMap()

// --------------------------------------------------
// PROPS INITIALIZATION
// --------------------------------------------------

let propsInitialized = false

function initComponentProps() {
  if (!isDOM || propsInitialized) {
    return
  }

  propsInitialized = true

  initProps()
}

// --------------------------------------------------
// RESOLVE LAYOUT CONFIG
// --------------------------------------------------

function resolveLayoutConfig(element) {
  if (!element) {
    return null
  }

  const configKey = element.dataset?.config

  if (!configKey) {
    return null
  }

  const clientConfig = isBrowser
    ? window.__nexoClientConfig
    : null

  if (!clientConfig) {
    return null
  }

  const config = clientConfig[configKey]

  if (
    !config ||
    typeof config !== 'object' ||
    Array.isArray(config)
  ) {
    return null
  }

  return {
    key: configKey,
    config,
  }
}

// --------------------------------------------------
// RESOLVE COMPONENT NAME
// --------------------------------------------------

function resolveComponentName(element) {
  const resolved = resolveLayoutConfig(element)

  if (!resolved) {
    return null
  }

  const { key, config } = resolved

  const component = config.component

  if (typeof component !== 'string' || !component.trim()) {
    console.error(
      `[NEXO] A configuração "${key}" não possui um componente válido.`
    )

    return null
  }

  const cleanComponent = component
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleanComponent) {
    return null
  }

  return `${key}/${cleanComponent}`
}

// --------------------------------------------------
// RESOLVE COMPONENT PROPS
// --------------------------------------------------

function resolveLayoutProps(element) {
  const resolved = resolveComponentProps(element)

  if (
    !resolved ||
    typeof resolved !== 'object' ||
    Array.isArray(resolved)
  ) {
    return {}
  }

  return {
    ...resolved,
  }
}

// --------------------------------------------------
// NORMALIZE COMPONENT NAME
// --------------------------------------------------

function normalizeComponentName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    return null
  }

  const cleanName = name
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleanName) {
    return null
  }

  // ----------------------------------------------
  // CATEGORY/COMPONENT
  // ----------------------------------------------

  if (cleanName.includes('/')) {
    const parts = cleanName.split('/').filter(Boolean)

    if (parts.length !== 2) {
      return null
    }

    return `${parts[0]}/${parts[1]}`
  }

  // ----------------------------------------------
  // CATEGORY-COMPONENT
  // ----------------------------------------------

  if (cleanName.includes('-')) {
    const separator = cleanName.indexOf('-')

    const category = cleanName.slice(0, separator).trim()

    const component = cleanName.slice(separator + 1).trim()

    if (!category || !component) {
      return null
    }

    return `${category}/${component}`
  }

  return null
}

// --------------------------------------------------
// PATH RESOLVER
// --------------------------------------------------

function getComponentPath(name) {
  const normalized = normalizeComponentName(name)

  if (!normalized) {
    throw new Error(
      `[NEXO] Nome de componente inválido: ${name}`
    )
  }

  const parts = normalized.split('/').filter(Boolean)

  const [category, component] = parts

  return (
    `/src/components/layouts/` +
    `${category}/` +
    `${component}.html`
  )
}

// --------------------------------------------------
// SCRIPT CONTEXT
// --------------------------------------------------

function setScriptContext(container, props, componentName) {
  if (!isBrowser) {
    return () => {}
  }

  const previous = {
    container: window.container,
    props: window.props,
    componentName: window.componentName,
  }

  window.container = container

  window.props = props || {}

  window.componentName = componentName || ''

  return () => {
    // --------------------------------------------
    // RESTORE CONTAINER
    // --------------------------------------------

    if (previous.container === undefined) {
      try {
        delete window.container
      } catch {
        window.container = undefined
      }
    } else {
      window.container = previous.container
    }

    // --------------------------------------------
    // RESTORE PROPS
    // --------------------------------------------

    if (previous.props === undefined) {
      try {
        delete window.props
      } catch {
        window.props = undefined
      }
    } else {
      window.props = previous.props
    }

    // --------------------------------------------
    // RESTORE COMPONENT NAME
    // --------------------------------------------

    if (previous.componentName === undefined) {
      try {
        delete window.componentName
      } catch {
        window.componentName = undefined
      }
    } else {
      window.componentName = previous.componentName
    }
  }
}

// --------------------------------------------------
// LOAD STYLE
// --------------------------------------------------

function loadStyle(link) {
  if (!isDOM || !link) {
    return Promise.resolve()
  }

  const rawHref = link.getAttribute('href')

  if (!rawHref) {
    return Promise.resolve()
  }

  const href = new URL(rawHref, document.baseURI).href

  // ----------------------------------------------
  // ALREADY LOADED
  // ----------------------------------------------

  if (loadedStyles.has(href)) {
    return Promise.resolve()
  }

  // ----------------------------------------------
  // LOAD
  // ----------------------------------------------

  return new Promise((resolve) => {
    const newLink = document.createElement('link')

    newLink.rel = 'stylesheet'

    newLink.href = href

    let finished = false

    const done = (success = true) => {
      if (finished) {
        return
      }

      finished = true

      if (success) {
        loadedStyles.add(href)
      }

      resolve()
    }

    newLink.onload = () => {
      done(true)
    }

    newLink.onerror = (error) => {
      console.warn(
        `[NEXO] Não foi possível carregar stylesheet: ${href}`,
        error
      )

      done(false)
    }

    document.head.appendChild(newLink)
  })
}

// --------------------------------------------------
// LOAD SCRIPT
// --------------------------------------------------

function loadScript(
  script,
  componentName,
  index,
  container,
  props = {}
) {
  if (!isDOM || !script) {
    return Promise.resolve()
  }

  const src = script.getAttribute('src')

  const absoluteSrc = src
    ? new URL(src, document.baseURI).href
    : null

  const id = src
    ? `${componentName}-${absoluteSrc}`
    : `${componentName}-inline-${index}`

  // ----------------------------------------------
  // ALREADY LOADED
  // ----------------------------------------------

  if (loadedScripts.has(id)) {
    return Promise.resolve()
  }

  // ----------------------------------------------
  // SCRIPT CONTEXT
  // ----------------------------------------------

  const restoreContext = setScriptContext(
    container,
    props,
    componentName
  )

  const el = document.createElement('script')

  // ----------------------------------------------
  // COPY ATTRIBUTES
  // ----------------------------------------------

  for (const attribute of script.attributes) {
    const name = attribute.name

    if (name === 'src' || name === 'defer') {
      continue
    }

    el.setAttribute(name, attribute.value)
  }

  // ----------------------------------------------
  // EXTERNAL SCRIPT
  // ----------------------------------------------

  if (absoluteSrc) {
    return new Promise((resolve) => {
      let finished = false

      const done = (success = true) => {
        if (finished) {
          return
        }

        finished = true

        if (success) {
          loadedScripts.add(id)
        }

        restoreContext()
        resolve()
      }

      el.onload = () => {
        done(true)
      }

      el.onerror = (error) => {
        console.error(
          `[NEXO] Erro ao carregar script externo: ${absoluteSrc}`,
          error
        )

        done(false)
      }

      el.src = absoluteSrc

      document.body.appendChild(el)
    })
  }

  // ----------------------------------------------
  // INLINE SCRIPT
  // ----------------------------------------------

  const source = script.textContent || ''

  try {
    const execute = new Function(
      'container',
      'props',
      'componentName',
      source
    )

    execute(container, props || {}, componentName)

    loadedScripts.add(id)
  } catch (error) {
    console.error(
      `[NEXO] Erro no script inline do componente "${componentName}"`,
      error
    )
  } finally {
    restoreContext()
  }

  return Promise.resolve()
}

// --------------------------------------------------
// LOAD MODELS
// --------------------------------------------------

async function loadComponentModels(container) {
  if (!isDOM || !container) {
    return
  }

  try {
    await loadModels(container)
  } catch (error) {
    console.warn(
      '[NEXO] Não foi possível carregar os models do componente.',
      error
    )
  }
}

// --------------------------------------------------
// APPLY ASSETS TO COMPONENT
// --------------------------------------------------

async function applyComponentAssets(container) {
  if (!isDOM || !container) {
    return
  }

  try {
    const utils = await import('/src/modules/core/utils.js')

    if (utils && typeof utils.applyAssets === 'function') {
      await utils.applyAssets(container)
    }
  } catch (error) {
    console.warn(
      '[NEXO] Não foi possível aplicar os assets do componente.',
      error
    )
  }
}

// --------------------------------------------------
// APPLY COMPONENT APPEARANCE
// --------------------------------------------------

function applyComponentStyles(container, props = {}) {
  if (!isDOM || !container) {
    return
  }

  try {
    applyComponentAppearance(container, props)
  } catch (error) {
    console.warn(
      '[NEXO] Não foi possível aplicar a aparência do componente.',
      error
    )
  }
}

// --------------------------------------------------
// GET LAYOUT ELEMENTS
// --------------------------------------------------

function getLayoutElements(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return []
  }

  const elements = []

  // ----------------------------------------------
  // ROOT
  // ----------------------------------------------

  if (
    root.nodeType === 1 &&
    root.hasAttribute?.('data-config')
  ) {
    elements.push(root)
  }

  // ----------------------------------------------
  // DESCENDANTS
  // ----------------------------------------------

  elements.push(...root.querySelectorAll('[data-config]'))

  return elements
}

// --------------------------------------------------
// LOAD CHILD COMPONENTS
// --------------------------------------------------

async function loadChildComponents(container) {
  if (!isDOM || !container) {
    return
  }

  const elements = getLayoutElements(container)

  for (const element of elements) {
    if (element === container) {
      continue
    }

    if (element.dataset.initialized === 'true') {
      continue
    }

    if (componentLoading.has(element)) {
      continue
    }

    const name = resolveComponentName(element)

    if (!name) {
      continue
    }

    const props = resolveLayoutProps(element)

    const loading = loadLayouts(name, element, props)

    componentLoading.set(element, loading)

    try {
      await loading
    } finally {
      componentLoading.delete(element)
    }
  }
}

// --------------------------------------------------
// CREATE PAGE COMPONENT CONTAINER
// --------------------------------------------------

function createPageComponentContainer(component, index) {
  if (
    !component ||
    typeof component !== 'object' ||
    Array.isArray(component)
  ) {
    return null
  }

  const componentName = component.component

  if (
    typeof componentName !== 'string' ||
    !componentName.trim()
  ) {
    console.warn(
      `[NEXO] Componente da página na posição ${index + 1} não possui um nome válido.`
    )

    return null
  }

  const normalized = normalizeComponentName(componentName)

  if (!normalized) {
    console.warn(
      `[NEXO] Componente da página "${componentName}" possui um nome inválido.`
    )

    return null
  }

  const container = document.createElement('div')

  container.dataset.pageComponent = 'true'

  container.dataset.component = componentName

  container.dataset.componentIndex = String(index)

  container.dataset.componentPath = normalized

  const props =
    component.props &&
    typeof component.props === 'object' &&
    !Array.isArray(component.props)
      ? {
          ...component.props,
        }
      : {}

  return {
    container,
    componentName: normalized,
    props,
  }
}

// --------------------------------------------------
// CLEAR PAGE COMPONENTS
// --------------------------------------------------

function clearPageComponents(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return
  }

  const components = root.querySelectorAll(
    '[data-page-component="true"]'
  )

  components.forEach((element) => {
    element.remove()
  })
}

// --------------------------------------------------
// LOAD PAGE COMPONENTS
// --------------------------------------------------

async function loadPageComponents(root, page) {
  if (
    !isDOM ||
    !root ||
    !page ||
    typeof page !== 'object'
  ) {
    return
  }

  const components = Array.isArray(page.components)
    ? page.components
    : []

  // ----------------------------------------------
  // CLEAR PREVIOUS PAGE
  // ----------------------------------------------

  clearPageComponents(root)

  if (!components.length) {
    return
  }

  // ----------------------------------------------
  // LOAD COMPONENTS
  // ----------------------------------------------

  for (let index = 0; index < components.length; index++) {
    const definition = createPageComponentContainer(
      components[index],
      index
    )

    if (!definition) {
      continue
    }

    const { container, componentName, props } = definition

    // --------------------------------------------
    // INSERT COMPONENT CONTAINER
    // --------------------------------------------

    root.appendChild(container)

    // --------------------------------------------
    // LOAD COMPONENT
    // --------------------------------------------

    const loading = loadLayouts(
      componentName,
      container,
      props
    )

    componentLoading.set(container, loading)

    try {
      await loading
    } finally {
      componentLoading.delete(container)
    }
  }
}

// --------------------------------------------------
// CORE LOADER
// --------------------------------------------------

export async function loadLayouts(
  componentName,
  container,
  props = {}
) {
  if (!isDOM) {
    return false
  }

  if (!componentName || !container) {
    return false
  }

  // ----------------------------------------------
  // INITIALIZE PROPS SYSTEM
  // ----------------------------------------------

  initComponentProps()

  // ----------------------------------------------
  // NORMALIZE PROPS
  // ----------------------------------------------

  if (
    !props ||
    typeof props !== 'object' ||
    Array.isArray(props)
  ) {
    props = {}
  }

  // ----------------------------------------------
  // PREVENT DUPLICATE INITIALIZATION
  // ----------------------------------------------

  if (container.dataset?.initialized === 'true') {
    return true
  }

  // ----------------------------------------------
  // NORMALIZE COMPONENT NAME
  // ----------------------------------------------

  const normalizedName =
    normalizeComponentName(componentName)

  if (!normalizedName) {
    console.error(
      `[NEXO] Nome de componente inválido: ${componentName}`
    )

    return false
  }

  // ----------------------------------------------
  // CACHE
  // ----------------------------------------------

  let html = componentCache.get(normalizedName)

  // ----------------------------------------------
  // FETCH COMPONENT
  // ----------------------------------------------

  if (!html) {
    try {
      const componentUrl = getComponentPath(normalizedName)

      console.log(
        `[NEXO] Carregando componente: ${componentUrl}`
      )

      const response = await fetch(componentUrl, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(
          `Componente ${normalizedName} não encontrado`
        )
      }

      html = await response.text()

      componentCache.set(normalizedName, html)
    } catch (error) {
      container.innerHTML = `
        <p style="color:red">
          Erro ao carregar ${componentName}
        </p>
      `

      console.error(
        '[NEXO] Erro ao carregar componente:',
        componentName,
        error
      )

      return false
    }
  }

  // ----------------------------------------------
  // RENDER PROPS
  // ----------------------------------------------

  const renderedHTML = renderProps(html, props)

  // ----------------------------------------------
  // PARSE HTML
  // ----------------------------------------------

  const temp = document.createElement('div')

  temp.innerHTML = renderedHTML

  // ----------------------------------------------
  // STYLES
  // ----------------------------------------------

  const styleLinks = Array.from(
    temp.querySelectorAll('link[rel="stylesheet"]')
  )

  await Promise.all(styleLinks.map(loadStyle))

  // ----------------------------------------------
  // SCRIPTS
  // ----------------------------------------------

  const scripts = Array.from(
    temp.querySelectorAll('script')
  )

  scripts.forEach((script) => {
    script.remove()
  })

  // ----------------------------------------------
  // INSERT HTML
  // ----------------------------------------------

  container.innerHTML = temp.innerHTML

  // ----------------------------------------------
  // APPLY COMPONENT APPEARANCE
  // ----------------------------------------------

  applyComponentStyles(container, props)

  // ----------------------------------------------
  // LOAD CHILD LAYOUTS
  // ----------------------------------------------

  await loadChildComponents(container)

  // ----------------------------------------------
  // APPLY INITIAL ASSETS
  // ----------------------------------------------

  await applyComponentAssets(container)

  // ----------------------------------------------
  // EXECUTE COMPONENT SCRIPTS
  // ----------------------------------------------

  for (let index = 0; index < scripts.length; index++) {
    await loadScript(
      scripts[index],
      normalizedName,
      index,
      container,
      props
    )
  }

  // ----------------------------------------------
  // LOAD MODELS
  // ----------------------------------------------

  await loadComponentModels(container)

  // ----------------------------------------------
  // APPLY ASSETS AGAIN
  // ----------------------------------------------

  await applyComponentAssets(container)

  // ----------------------------------------------
  // OPTIONAL GLOBAL HOOK
  // ----------------------------------------------

  if (typeof window.setupInstallButton === 'function') {
    try {
      window.setupInstallButton()
    } catch (error) {
      console.warn(
        '[NEXO] Erro em setupInstallButton:',
        error
      )
    }
  }

  // ----------------------------------------------
  // MARK AS INITIALIZED
  // ----------------------------------------------

  container.dataset.initialized = 'true'

  // ----------------------------------------------
  // COMPONENT EVENT
  // ----------------------------------------------

  container.dispatchEvent(
    new CustomEvent('component:loaded', {
      bubbles: true,
      detail: {
        name: normalizedName,
        root: container,
        props,
      },
    })
  )

  return true
}

// --------------------------------------------------
// COMPONENT LOADER
// --------------------------------------------------

export async function loadAllComponents(
  root = document,
  page = null
) {
  if (!isDOM) {
    return
  }

  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return
  }

  // ----------------------------------------------
  // INITIALIZE PROPS SYSTEM
  // ----------------------------------------------

  initComponentProps()

  // ----------------------------------------------
  // LOAD PAGE COMPONENTS
  // ----------------------------------------------

  if (page) {
    await loadPageComponents(root, page)
  } else {
    clearPageComponents(root)
  }

  // ----------------------------------------------
  // COLLECT LAYOUTS
  // ----------------------------------------------

  const elements = getLayoutElements(root)

  // ----------------------------------------------
  // LOAD
  // ----------------------------------------------

  for (const element of elements) {
    if (element.dataset.initialized === 'true') {
      continue
    }

    if (componentLoading.has(element)) {
      continue
    }

    // --------------------------------------------
    // RESOLVE COMPONENT
    // --------------------------------------------

    const name = resolveComponentName(element)

    if (!name) {
      continue
    }

    // --------------------------------------------
    // PROPS
    // --------------------------------------------

    const props = resolveLayoutProps(element)

    // --------------------------------------------
    // LOCK
    // --------------------------------------------

    const loading = loadLayouts(name, element, props)

    componentLoading.set(element, loading)

    try {
      await loading
    } finally {
      componentLoading.delete(element)
    }
  }
}
