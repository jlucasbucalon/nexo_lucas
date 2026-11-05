// --------------------------------------------------
// NAVIGATION HANDLER
// --------------------------------------------------

export function handleNavigation(resolveRoute) {
  // --------------------------------------------------
  // SMOOTH SCROLL
  // --------------------------------------------------

  function smoothScrollTo(target, duration = 800) {
    const start = window.scrollY

    const targetPosition =
      target.getBoundingClientRect().top + window.scrollY

    const distance = targetPosition - start

    let startTime = null

    // --------------------------------------------------
    // ANIMATION
    // --------------------------------------------------

    function animation(currentTime) {
      if (startTime === null) {
        startTime = currentTime
      }

      const elapsed = currentTime - startTime

      const progress = Math.min(elapsed / duration, 1)

      // --------------------------------------------------
      // EASE IN OUT
      // --------------------------------------------------

      const easing =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2

      window.scrollTo(0, start + distance * easing)

      if (progress < 1) {
        requestAnimationFrame(animation)
      }
    }

    requestAnimationFrame(animation)
  }

  // --------------------------------------------------
  // CLICK HANDLER
  // --------------------------------------------------

  document.addEventListener('click', (event) => {
    // --------------------------------------------------
    // FIND LINK
    // --------------------------------------------------

    const link = event.target.closest('a')

    if (!link) {
      return
    }

    // --------------------------------------------------
    // HREF
    // --------------------------------------------------

    const href = link.getAttribute('href')

    if (!href) {
      return
    }

    // ==================================================
    // SPA NAVIGATION
    // ==================================================

    if (link.hasAttribute('page')) {
      event.preventDefault()

      // --------------------------------------------------
      // NEW ROUTE
      // --------------------------------------------------

      if (window.location.hash !== href) {
        window.location.hash = href
      } else {
        // --------------------------------------------------
        // SAME ROUTE
        // --------------------------------------------------

        resolveRoute()
      }

      return
    }

    // ==================================================
    // INTERNAL SCROLL
    // ==================================================

    if (link.hasAttribute('move')) {
      event.preventDefault()

      const target = document.querySelector(href)

      if (!target) {
        return
      }

      const duration = Number(link.dataset.duration) || 800

      smoothScrollTo(target, duration)

      return
    }
  })
}
