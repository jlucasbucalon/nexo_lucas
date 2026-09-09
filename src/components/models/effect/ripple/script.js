window.Components = window.Components || {}
window.Components['effect-ripple'] = {
  init: function () {
    document
      .querySelectorAll('.effect-ripple')
      .forEach((effect) => {
        let isTouching = false

        function createRipple(e) {
          const rect = effect.getBoundingClientRect()
          const clientX = e.touches
            ? e.touches[0].clientX
            : e.clientX
          const clientY = e.touches
            ? e.touches[0].clientY
            : e.clientY

          const maxX = Math.max(
            clientX - rect.left,
            rect.right - clientX
          )
          const maxY = Math.max(
            clientY - rect.top,
            rect.bottom - clientY
          )
          const radius = Math.sqrt(maxX ** 2 + maxY ** 2)

          const ripple = document.createElement('span')
          ripple.classList.add('ripple_effect')
          ripple.style.width =
            ripple.style.height = `${radius * 2}px`
          ripple.style.left = `${clientX - rect.left - radius}px`
          ripple.style.top = `${clientY - rect.top - radius}px`

          effect
            .querySelectorAll('.ripple_effect')
            .forEach((r) => r.remove())
          effect.appendChild(ripple)

          function removeRipple() {
            ripple.classList.add('fade-out')
            setTimeout(() => ripple.remove(), 300)
          }

          effect.addEventListener('mouseup', removeRipple, {
            once: true,
          })
          effect.addEventListener(
            'mouseleave',
            removeRipple,
            { once: true }
          )
          effect.addEventListener(
            'touchend',
            removeRipple,
            { once: true }
          )
          effect.addEventListener(
            'touchcancel',
            removeRipple,
            { once: true }
          )
        }

        effect.addEventListener(
          'touchstart',
          (e) => {
            isTouching = true
            createRipple(e)
          },
          { passive: true }
        )

        effect.addEventListener('mousedown', (e) => {
          if (isTouching) return
          createRipple(e)
        })

        effect.addEventListener('click', () => {
          setTimeout(() => (isTouching = false), 300)
        })
      })
  },
}
