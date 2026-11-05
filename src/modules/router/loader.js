import { applyFade } from '../core/sheet.js'
import { reexecuteScripts } from './scripts.js'
import { updateHeadFromHTML } from './head.js'

export async function loadPage(pagePath, root) {
  try {
    const res = await fetch(`${pagePath}.html`, {
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(res.status)

    const html = await res.text()

    updateHeadFromHTML(html, pagePath)

    await applyFade(root, async () => {
      root.innerHTML = html
      reexecuteScripts(root)

      document.dispatchEvent(
        new CustomEvent('spa:pageLoaded', {
          detail: {
            page: pagePath,
          },
        })
      )
    })
  } catch (err) {
    console.error(err)
    root.innerHTML = '<p>Erro ao carregar página</p>'
  }
}
