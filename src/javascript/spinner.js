const overlay = document.querySelector('.overlay')

export const showSpinner = (delay = 2000) => {
  overlay.style.display = 'block'

  setTimeout(() => {
    overlay.style.display = 'none'
  }, delay)
}

export const hideSpinner = () => {
  overlay.style.display = 'none'
}
