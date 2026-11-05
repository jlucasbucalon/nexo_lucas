export async function reexecuteScripts(root) {
  if (
    !root ||
    typeof root.querySelectorAll !== 'function'
  ) {
    return
  }

  const scripts = Array.from(
    root.querySelectorAll('script')
  )

  for (const oldScript of scripts) {
    const newScript = document.createElement('script')

    // ----------------------------------------------
    // COPY ATTRIBUTES
    // ----------------------------------------------

    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value)
    })

    // ----------------------------------------------
    // EXTERNAL SCRIPT
    // ----------------------------------------------

    if (oldScript.src) {
      const scriptUrl = new URL(
        oldScript.src,
        document.baseURI
      ).href

      await new Promise((resolve, reject) => {
        newScript.onload = resolve

        newScript.onerror = () => {
          reject(
            new Error(
              `[SPA] Erro ao carregar script: ${scriptUrl}`
            )
          )
        }

        newScript.src = scriptUrl

        oldScript.replaceWith(newScript)
      })

      continue
    }

    // ----------------------------------------------
    // INLINE SCRIPT
    // ----------------------------------------------

    newScript.textContent = oldScript.textContent

    oldScript.replaceWith(newScript)
  }
}
