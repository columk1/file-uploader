import { createErrorMessageLookup, getError, debounce } from './formHelpers.js'

await Promise.all([customElements.whenDefined('sl-input')])

document.body.style.display = 'block'

const form = document.getElementById('sign-up-form')
const username = document.getElementById('username')
const usernameErrorIcon = document.querySelector('#username sl-icon')
const usernameError = document.querySelector('#username ~ span.error')
const password = document.getElementById('password')
const passwordErrorIcon = document.querySelector('#password sl-icon')
const passwordError = document.querySelector('#password ~ span.error')
const confirmPassword = document.getElementById('confirm-password')
const confirmPasswordErrorIcon = document.querySelector('#confirm-password sl-icon')
const confirmPasswordError = document.querySelector('#confirm-password ~ span.error')

const usernameErrorMessages = createErrorMessageLookup('username', 'Username is available')
const passwordErrorMessages = createErrorMessageLookup('password')

const getUsernameError = () => getError(username, usernameErrorMessages)
const getPasswordError = () => getError(password, passwordErrorMessages)

// Logic for error messages returned from the server
const removeError = (e) => {
  e.textContent = ''
  e.classList.remove('active')
  console.log(e.classList)
}

const onInput = (e) => removeError(e)

// Remove the server error when the user starts typing to allow client-side validation to take over
username.addEventListener('sl-input', () => onInput(usernameError), { once: true })

password.addEventListener('sl-input', () => onInput(passwordError), { once: true })

function validateUsername() {
  usernameErrorIcon.classList.remove('hidden')
  if (username.validity.valid) {
    username.helpText = getUsernameError()
    usernameErrorIcon.name = 'check2-circle'
  } else {
    // If there is still an error, show the correct error
    username.helpText = getUsernameError()
    usernameErrorIcon.name = 'exclamation-octagon'
  }
}

function validatePassword() {
  passwordErrorIcon.classList.remove('hidden')
  if (password.validity.valid) {
    password.helpText = ''
    passwordErrorIcon.name = 'check2-circle'
  } else {
    password.helpText = getPasswordError()
    passwordErrorIcon.name = 'exclamation-octagon'
  }
  if (confirmPassword.value) validateConfirmPassword()
}

function validateConfirmPassword() {
  confirmPasswordErrorIcon.classList.remove('hidden')
  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Passwords Don't Match")
    console.log(confirmPassword.validity)
  } else {
    confirmPassword.setCustomValidity('')
    password.setCustomValidity('')
  }
  if (confirmPassword.validity.valid) {
    confirmPassword.helpText = ''
    confirmPasswordErrorIcon.name = 'check2-circle'
  } else {
    confirmPassword.helpText = confirmPassword.validationMessage
    confirmPasswordErrorIcon.name = 'exclamation-octagon'
  }
}

// Validate on first change, then on input
const setupValidationListeners = (element, validateFn) => {
  const handleChange = (e) => {
    validateFn()
    username.removeEventListener('sl-change', validateUsername)
    username.addEventListener('input', validateUsername)
  }
  element.addEventListener('sl-change', handleChange)
}

setupValidationListeners(username, validateUsername)
setupValidationListeners(password, validatePassword)
setupValidationListeners(confirmPassword, validateConfirmPassword)

form.addEventListener('submit', (event) => {
  // Only allow submission if all fields are valid
  if (!username.validity.valid) {
    event.preventDefault() // Prevent submission
    validateUsername() // Display an appropriate error message
  }
  if (!password.validity.valid) {
    event.preventDefault()
    validatePassword()
  }
  if (!confirmPassword.validity.valid) {
    event.preventDefault()
    validateConfirmPassword()
  }
})
username.addEventListener('input', (e) => {
  validateUniqueUsername(e.target.value)
})

const validateUniqueUsername = debounce(async (usernameInputValue) => {
  // Avoid validating too early
  if (usernameInputValue.length < username.minlength) return

  try {
    const response = await fetch(
      `http://localhost:3000/validate-username?username=${encodeURIComponent(usernameInputValue)}`
    )

    const result = await response.json()

    if (result.isAvailable) {
      username.setCustomValidity('')
      validateUsername()
    } else {
      username.setCustomValidity('Username not available')
      validateUsername()
    }
  } catch (error) {
    console.error('Error checking username:', error)
    username.helpText = 'Error checking username'
  }
}, 500)

const signupForm = document.getElementById('login-form')
const submitButton = document.querySelector('sl-button[type="submit"]')

signupForm.addEventListener('submit', () => {
  submitButton.loading = true
})
