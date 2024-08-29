export const showSpinner = (delay = 2000) => {
  const overlay = document.querySelector('.overlay')
  overlay.style.display = 'block'

  setTimeout(() => {
    overlay.style.display = 'none'
  }, delay)
}
