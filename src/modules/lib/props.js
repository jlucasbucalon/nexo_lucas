// --------------------------------------------------
// ENVIRONMENT
// --------------------------------------------------

const isBrowser = typeof window !== 'undefined'

const isDOM = isBrowser && typeof document !== 'undefined'

// --------------------------------------------------
// TEMPLATE ENGINE
// --------------------------------------------------

export function renderProps(template, props = {}) {
  let rendered = String(template ?? '')

  if (
    !props ||
    typeof props !== 'object' ||
    Array.isArray(props)
  ) {
    return rendered
  }

  for (const key of Object.keys(props)) {
    const value = props[key]

    const safe = String(value ?? '').replace(
      /[&<>"]/g,
      (match) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
        })[match]
    )

    const escapedKey = key.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    )

    const pattern = new RegExp(
      `{{\\s*${escapedKey}\\s*}}`,
      'g'
    )

    rendered = rendered.replace(pattern, safe)
  }

  return rendered
}

// --------------------------------------------------
// GET CLIENT CONFIG
// --------------------------------------------------

function getClientConfig() {
  if (!isBrowser || !window.__nexoClientConfig) {
    return null
  }

  return window.__nexoClientConfig
}

// --------------------------------------------------
// GET CURRENT THEME
// --------------------------------------------------

function getCurrentTheme() {
  if (!isDOM) {
    return 'light'
  }

  return document.documentElement.dataset.theme === 'dark'
    ? 'dark'
    : 'light'
}

// --------------------------------------------------
// VALIDATE OBJECT
// --------------------------------------------------

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

// --------------------------------------------------
// RESOLVE LAYOUT CONFIG
// --------------------------------------------------

function resolveLayoutConfig(element, clientConfig) {
  if (!element || !clientConfig) {
    return null
  }

  const configKey = element.dataset?.config

  if (!configKey) {
    return null
  }

  const config = clientConfig[configKey]

  if (!isPlainObject(config)) {
    return null
  }

  return config
}

// --------------------------------------------------
// RESOLVE COMPONENT PROPS
// --------------------------------------------------

export function resolveComponentProps(element) {
  if (!element) {
    return {}
  }

  const clientConfig = getClientConfig()

  let props = {}

  // ------------------------------------------------
  // LAYOUT
  // ------------------------------------------------

  const layoutConfig = resolveLayoutConfig(
    element,
    clientConfig
  )

  if (layoutConfig) {
    // ----------------------------------------------
    // PROPS DO LAYOUT
    // ----------------------------------------------

    if (isPlainObject(layoutConfig.props)) {
      props = {
        ...layoutConfig.props,
      }
    }

    // ----------------------------------------------
    // APPEARANCE DO LAYOUT
    // ----------------------------------------------

    if (isPlainObject(layoutConfig.appearance)) {
      props.appearance = layoutConfig.appearance
    }
  }

  // ------------------------------------------------
  // EXPLICIT PROPS
  // ------------------------------------------------

  if (element.dataset?.props) {
    try {
      const explicitProps = JSON.parse(
        element.dataset.props
      )

      if (isPlainObject(explicitProps)) {
        props = {
          ...props,
          ...explicitProps,
        }
      }
    } catch (error) {
      console.warn(
        `[NEXO] data-props inválido em ${
          element.dataset?.config ||
          element.dataset?.component ||
          element.className ||
          'componente'
        }`,
        error
      )
    }
  }

  return props
}

// --------------------------------------------------
// RESOLVE APPEARANCE
// --------------------------------------------------

function resolveAppearance(appearance) {
  if (!isPlainObject(appearance)) {
    return {
      mode: 'simple',
      values: {},
    }
  }

  // ------------------------------------------------
  // DETECT THEME CONFIGURATION
  // ------------------------------------------------

  const hasLight = Object.prototype.hasOwnProperty.call(
    appearance,
    'light'
  )

  const hasDark = Object.prototype.hasOwnProperty.call(
    appearance,
    'dark'
  )

  // ------------------------------------------------
  // THEME APPEARANCE
  // ------------------------------------------------

  if (hasLight || hasDark) {
    const theme = getCurrentTheme()

    const values = appearance[theme]

    if (!isPlainObject(values)) {
      return {
        mode: 'theme',
        values: {},
      }
    }

    return {
      mode: 'theme',
      values,
    }
  }

  // ------------------------------------------------
  // SIMPLE APPEARANCE
  // ------------------------------------------------

  return {
    mode: 'simple',
    values: appearance,
  }
}

// --------------------------------------------------
// NORMALIZE VARIABLE NAME
// --------------------------------------------------

function normalizeVariableName(name) {
  if (!name) {
    return ''
  }

  const value = String(name).trim()

  if (!value) {
    return ''
  }

  return value.startsWith('--') ? value : `--${value}`
}

// --------------------------------------------------
// APPLY APPEARANCE
// --------------------------------------------------

function applyAppearance(element, appearance, key) {
  if (!element) {
    return
  }

  const resolved = resolveAppearance(appearance)

  const values = resolved.values || {}

  // ------------------------------------------------
  // REMOVE PREVIOUS VARIABLES
  // ------------------------------------------------

  const controlled =
    element.__nexoAppearanceProperties?.[key] || []

  for (const variableName of controlled) {
    element.style.removeProperty(variableName)
  }

  // ------------------------------------------------
  // APPLY NEW VARIABLES
  // ------------------------------------------------

  const applied = []

  for (const [name, value] of Object.entries(values)) {
    if (!name || value === null || value === undefined) {
      continue
    }

    const variableName = normalizeVariableName(name)

    if (!variableName) {
      continue
    }

    element.style.setProperty(variableName, String(value))

    applied.push(variableName)
  }

  // ------------------------------------------------
  // STORE CONTROLLED VARIABLES
  // ------------------------------------------------

  if (!element.__nexoAppearanceProperties) {
    element.__nexoAppearanceProperties = {}
  }

  element.__nexoAppearanceProperties[key] = applied

  // ------------------------------------------------
  // STORE CURRENT THEME
  // ------------------------------------------------

  if (!element.__nexoAppearanceTheme) {
    element.__nexoAppearanceTheme = {}
  }

  element.__nexoAppearanceTheme[key] = getCurrentTheme()
}

// --------------------------------------------------
// APPLY COMPONENT APPEARANCE (LAYOUTS)
// --------------------------------------------------

export function applyComponentAppearance(
  element,
  props = {}
) {
  if (!element) {
    return
  }

  if (!isPlainObject(props)) {
    return
  }

  // ------------------------------------------------
  // LAYOUT APPEARANCE
  // ------------------------------------------------

  if (isPlainObject(props.appearance)) {
    applyAppearance(element, props.appearance, 'layout')
  }
}

// --------------------------------------------------
// APPLY COMPONENT PROPS
// --------------------------------------------------

export function applyComponentProps(element) {
  if (!element) {
    return {}
  }

  const props = resolveComponentProps(element)

  applyComponentAppearance(element, props)

  return props
}

// --------------------------------------------------
// REFRESH COMPONENT APPEARANCE
// --------------------------------------------------

export function refreshComponentAppearance(element) {
  if (!element) {
    return
  }

  const props = resolveComponentProps(element)

  applyComponentAppearance(element, props)
}

// --------------------------------------------------
// GET MODELS CONFIG (JSON do cliente)
// --------------------------------------------------

function getModelsConfig() {
  const clientConfig = getClientConfig()

  return clientConfig?.models || null
}

// --------------------------------------------------
// RESOLVE MODEL APPEARANCE
// --------------------------------------------------

function resolveModelAppearance(element, modelsConfig) {
  if (!element || !modelsConfig) {
    return null
  }

  const key = element.dataset?.model

  if (!key) {
    return null
  }

  const entry = modelsConfig[key]

  if (
    !isPlainObject(entry) ||
    !isPlainObject(entry.appearance)
  ) {
    return null
  }

  return entry.appearance
}

// --------------------------------------------------
// APPLY MODEL APPEARANCE
// --------------------------------------------------

export function applyModelAppearance(element) {
  if (!element) {
    return
  }

  const appearance = resolveModelAppearance(
    element,
    getModelsConfig()
  )

  if (!appearance) {
    return
  }

  applyAppearance(element, appearance, 'model')
}

// --------------------------------------------------
// REFRESH MODEL APPEARANCE
// --------------------------------------------------

export function refreshModelAppearance(element) {
  applyModelAppearance(element)
}

// --------------------------------------------------
// GET APPEARANCE ELEMENTS
// --------------------------------------------------

function getAppearanceElements(root = document) {
  if (
    !isDOM ||
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return []
  }

  const elements = new Set()

  // ------------------------------------------------
  // ROOT
  // ------------------------------------------------

  if (
    root.nodeType === 1 &&
    (root.matches?.('[data-config]') ||
      root.matches?.('[data-model]'))
  ) {
    elements.add(root)
  }

  // ------------------------------------------------
  // LAYOUTS + MODELS
  // ------------------------------------------------

  root
    .querySelectorAll('[data-config], [data-model]')
    .forEach((element) => {
      elements.add(element)
    })

  return [...elements]
}

// --------------------------------------------------
// REFRESH ALL COMPONENT APPEARANCES
// --------------------------------------------------

export function refreshAllComponentAppearances(
  root = document
) {
  if (!isDOM || !root) {
    return
  }

  const elements = getAppearanceElements(root)

  for (const element of elements) {
    if (element.hasAttribute('data-config')) {
      refreshComponentAppearance(element)
    }

    if (element.hasAttribute('data-model')) {
      refreshModelAppearance(element)
    }
  }
}

// --------------------------------------------------
// THEME OBSERVER
// --------------------------------------------------

let themeObserver = null

export function observeComponentThemes() {
  if (!isDOM || themeObserver) {
    return
  }

  themeObserver = new MutationObserver((mutations) => {
    let themeChanged = false

    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'data-theme'
      ) {
        themeChanged = true

        break
      }
    }

    if (!themeChanged) {
      return
    }

    refreshAllComponentAppearances()
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
}

// --------------------------------------------------
// INIT PROPS
// --------------------------------------------------

let initialized = false

export function initProps() {
  if (!isDOM || initialized) {
    return
  }

  initialized = true

  refreshAllComponentAppearances()

  observeComponentThemes()
}
