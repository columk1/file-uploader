export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

export const createErrorMessageLookup = (fieldName, defaultMessage = '') => ({
  valueMissing: `${capitalize(fieldName)} is required`,
  typeMismatch: `Please enter a valid ${fieldName}`,
  tooShort: (field) => `${capitalize(fieldName)} should be at least ${field.minlength} characters`,
  customError: (field) => field.validationMessage,
  defaultMessage: defaultMessage,
})

export const getError = (field, errorMessages) => {
  const validity = field.validity

  // Find the first validity state that is true and return the corresponding error message
  for (const [key, message] of Object.entries(errorMessages)) {
    if (validity[key] && typeof message === 'function') {
      return message(field)
    }
    if (validity[key]) {
      return message
    }
  }

  // Return the default message if no other message was found
  return errorMessages.defaultMessage
}
