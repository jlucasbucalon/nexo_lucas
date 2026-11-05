const loadedCss = new Set()
const loadedJs = new Set()

export async function loadModels(root = document, config) {
  const classSet = new Set()

  // Coleta todas as classes contendo hífen
  root.querySelectorAll("[class*='-']").forEach((el) => {
    el.classList.forEach((c) => {
      if (c.includes('-')) classSet.add(c)
    })
  })

  const components = [...classSet]

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
}
