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

const getUsernameError = () => {
  console.log(username.validity.customError)
  console.log(username.validationMessage)
  return username.validity.valueMissing
    ? 'Username is required'
    : username.validity.typeMismatch
    ? 'Please enter a valid username'
    : username.validity.tooShort
    ? `Username should be at least ${username.minlength} characters`
    : username.validity.customError
    ? username.validationMessage // Username is not available
    : 'Username is available'
}

const getPasswordError = () => {
  return password.validity.valueMissing
    ? 'Password is required'
    : password.validity.tooShort
    ? `Password should be at least ${password.minlength} characters`
    : confirmPassword.validationMessage
}

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
    usernameErrorIcon.name = 'check-circle'
  } else {
    // If there is still an error, show the correct error
    username.helpText = getUsernameError()
    usernameErrorIcon.name = 'exclamation-circle'
  }
}

function validatePassword() {
  passwordErrorIcon.classList.remove('hidden')
  if (password.validity.valid) {
    password.helpText = ''
    passwordErrorIcon.name = 'check-circle'
  } else {
    password.helpText = getPasswordError()
    passwordErrorIcon.name = 'exclamation-circle'
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
    confirmPasswordErrorIcon.name = 'check-circle'
  } else {
    confirmPassword.helpText = confirmPassword.validationMessage
    confirmPasswordErrorIcon.name = 'exclamation-circle'
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

const debounce = (callback, wait) => {
  let timeout
  return function (...args) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => callback.apply(context, args), wait)
  }
}

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
