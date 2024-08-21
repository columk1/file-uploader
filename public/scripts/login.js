await Promise.all([customElements.whenDefined('sl-input')])

document.body.style.display = 'block'
const username = document.getElementById('username')
const password = document.getElementById('password')
const usernameError = document.getElementById('username-error')
const passwordError = document.getElementById('password-error')

const removeError = (e) => {
  e.textContent = ''
  e.classList.remove('active')
  console.log(e.classList)
}

const onInput = (e) => removeError(e)

username.addEventListener('sl-input', () => onInput(usernameError), { once: true })

password.addEventListener('sl-input', () => onInput(passwordError), { once: true })
