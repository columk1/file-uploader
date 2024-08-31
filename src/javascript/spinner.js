export const showSpinner = (delay = 2000) => {
  const overlay = document.querySelector('.overlay')
  overlay.style.display = 'block'

  setTimeout(() => {
    overlay.style.display = 'none'
  }, delay)
}

export const hideSpinner = () => {
  document.querySelector('.overlay').style.display = 'none'
}
