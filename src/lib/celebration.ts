const COLORS = ['#10b981', '#34d399', '#22c55e', '#86efac', '#f59e0b']

export function playCompletionBurst(x?: number, y?: number) {
  if (typeof document === 'undefined') return

  const originX = x ?? window.innerWidth / 2
  const originY = y ?? window.innerHeight / 3
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '0'
  container.style.top = '0'
  container.style.width = '100vw'
  container.style.height = '100vh'
  container.style.pointerEvents = 'none'
  container.style.zIndex = '9999'

  for (let i = 0; i < 18; i += 1) {
    const dot = document.createElement('span')
    const angle = (Math.PI * 2 * i) / 18
    const distance = 36 + Math.random() * 30
    dot.style.position = 'absolute'
    dot.style.left = `${originX}px`
    dot.style.top = `${originY}px`
    dot.style.width = '6px'
    dot.style.height = '6px'
    dot.style.borderRadius = '999px'
    dot.style.backgroundColor = COLORS[i % COLORS.length]
    dot.style.opacity = '1'
    dot.style.transform = 'translate(-50%, -50%)'
    dot.style.transition = 'transform 500ms ease-out, opacity 550ms ease-out'
    container.appendChild(dot)

    requestAnimationFrame(() => {
      dot.style.transform = `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance}px))`
      dot.style.opacity = '0'
    })
  }

  document.body.appendChild(container)
  window.setTimeout(() => container.remove(), 700)
}
