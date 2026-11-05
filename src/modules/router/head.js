// --------------------------------------------------
// UPDATE OR CREATE TAG
// --------------------------------------------------

function updateOrCreateTag(selector, tagName, attrs) {
  let el = document.head.querySelector(selector)

  if (!el) {
    el = document.createElement(tagName)
    document.head.appendChild(el)
  }

  Object.keys(attrs).forEach((key) => {
    el.setAttribute(key, attrs[key])
  })

  return el
}

// --------------------------------------------------
// TITLE
// --------------------------------------------------

function setTitle(title) {
  if (!title) {
    return
  }

  document.title = title
}

// --------------------------------------------------
// META NAME
// --------------------------------------------------

function setMeta(name, content) {
  if (!content) {
    return
  }

  updateOrCreateTag(`meta[name="${name}"]`, 'meta', {
    name,
    content,
  })
}

// --------------------------------------------------
// META PROPERTY
// --------------------------------------------------

function setProperty(property, content) {
  if (!content) {
    return
  }

  updateOrCreateTag(
    `meta[property="${property}"]`,
    'meta',
    {
      property,
      content,
    }
  )
}

// --------------------------------------------------
// LINK
// --------------------------------------------------

function setLink(rel, href) {
  if (!href) {
    return
  }

  updateOrCreateTag(`link[rel="${rel}"]`, 'link', {
    rel,
    href,
  })
}

// --------------------------------------------------
// PROFILE META
// --------------------------------------------------

export function updateHeadFromMeta(meta = {}) {
  if (!meta || typeof meta !== 'object') {
    return
  }

  // ----------------------------------------------
  // TITLE
  // ----------------------------------------------

  if (meta.title) {
    setTitle(meta.title)
  }

  // ----------------------------------------------
  // DESCRIPTION
  // ----------------------------------------------

  if (meta.description) {
    setMeta('description', meta.description)
  }

  // ----------------------------------------------
  // OPEN GRAPH
  // ----------------------------------------------

  if (meta.title) {
    setProperty('og:title', meta.og?.title || meta.title)
  }

  if (meta.description) {
    setProperty(
      'og:description',
      meta.og?.description || meta.description
    )
  }

  if (meta.image) {
    setProperty('og:image', meta.og?.image || meta.image)
  }

  if (meta.og?.type) {
    setProperty('og:type', meta.og.type)
  }

  if (meta.og?.url) {
    setProperty('og:url', meta.og.url)
  }

  // ----------------------------------------------
  // TWITTER
  // ----------------------------------------------

  if (meta.twitter?.card) {
    setMeta('twitter:card', meta.twitter.card)
  }

  if (meta.title) {
    setMeta(
      'twitter:title',
      meta.twitter?.title || meta.title
    )
  }

  if (meta.description) {
    setMeta(
      'twitter:description',
      meta.twitter?.description || meta.description
    )
  }

  if (meta.image) {
    setMeta(
      'twitter:image',
      meta.twitter?.image || meta.image
    )
  }

  // ----------------------------------------------
  // CANONICAL
  // ----------------------------------------------

  if (meta.og?.url) {
    setLink('canonical', meta.og.url)
  }
}

// --------------------------------------------------
// PAGE META
// --------------------------------------------------

export function updateHeadFromHTML(html, pagePath) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // ----------------------------------------------
  // TITLE
  // ----------------------------------------------

  const title =
    doc.querySelector('title')?.textContent ||
    doc.querySelector('[data-page-title]')?.textContent

  if (title) {
    setTitle(title)
  }

  // ----------------------------------------------
  // META NAME
  // ----------------------------------------------

  doc.querySelectorAll('meta[name]').forEach((meta) => {
    const name = meta.getAttribute('name')
    const content = meta.getAttribute('content')

    if (name && content) {
      setMeta(name, content)
    }
  })

  // ----------------------------------------------
  // OPEN GRAPH
  // ----------------------------------------------

  doc
    .querySelectorAll('meta[property^="og:"]')
    .forEach((meta) => {
      const property = meta.getAttribute('property')
      const content = meta.getAttribute('content')

      if (property && content) {
        setProperty(property, content)
      }
    })

  // ----------------------------------------------
  // LINKS
  // ----------------------------------------------

  const canonical = doc
    .querySelector('link[rel="canonical"]')
    ?.getAttribute('href')

  if (canonical) {
    setLink('canonical', canonical)
  }
}
