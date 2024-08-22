import { createFileInfoContent } from './createFileInfoContent.js'

await Promise.allSettled([
  customElements.whenDefined('sl-button'),
  customElements.whenDefined('sl-icon'),
  customElements.whenDefined('sl-icon-button'),
  customElements.whenDefined('sl-drawer'),
  customElements.whenDefined('sl-dialog'),
  customElements.whenDefined('sl-tree'),
  customElements.whenDefined('sl-tree-item'),
  customElements.whenDefined('sl-breadcrumb'),
  customElements.whenDefined('sl-breadcrumb-item'),
])

// Show body
document.body.style.display = 'block'

const dataScript = document.getElementById('data-script')
const files = JSON.parse(dataScript.textContent)

// Popup alert
const alert = document.querySelector('sl-alert')
if (alert) alert.toast()

// File info drawer
const drawer = document.querySelector('.drawer-overview')
const drawerContent = document.querySelector('.drawer-content')
const openButtons = document.querySelectorAll('.btn.grid-row[data-index]')
const downloadButton = drawer.querySelector('.drawer-download-btn')
const shareButton = drawer.querySelector('.drawer-share-btn')
const deleteFileForm = drawer.querySelector('.delete-file-form')
const closeButton = drawer.querySelector('.drawer-close-btn')

closeButton.addEventListener('click', () => drawer.hide())

openButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = button.getAttribute('data-index')
    const file = files[index]
    const newDrawerContent = createFileInfoContent(file)

    // Repopulate drawer with file info
    drawerContent.replaceChildren(newDrawerContent)
    // Add parentId to query for redirect in case of error
    const parentIdQuery = file.parentId ? '&parentId=' + file.parentId : ''
    downloadButton.href = `/download/${file.id}?filename=${file.name}&mimeType=${file.mimeType}${parentIdQuery}`
    downloadButton.addEventListener('click', function () {
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 2000)
    })
    shareButton.addEventListener('click', () => shareFileDialog.show())
    generateLinkButton.dataset.filename = file.name
    deleteFileForm.action = `/delete/${file.id}`

    // Show the drawer
    drawer.show()
  })
})

// Dialogs
const newFolderDialog = document.querySelector('.new-folder-dialog')
const deleteFolderDialog = document.querySelector('.delete-folder-dialog')
const shareFileDialog = document.querySelector('.share-dialog')
const shareFolderDialog = document.querySelector('.share-folder-dialog')
const newFileDialog = document.querySelector('.new-file-dialog')

const newFolderButtons = document.querySelectorAll('.new-folder-btn')
newFolderButtons.forEach((button) => button.addEventListener('click', () => newFolderDialog.show()))

const newFileButtons = document.querySelectorAll('.new-file-btn')
newFileButtons.forEach((button) => button.addEventListener('click', () => newFileDialog.show()))

const deleteFolderButtons = document.querySelectorAll('.delete-folder-btn')
deleteFolderButtons.forEach((button) =>
  button.addEventListener('click', () => deleteFolderDialog.show())
)

const closeDeleteFolderDialogButton = deleteFolderDialog.querySelector('sl-button[slot="footer"]')
closeDeleteFolderDialogButton.addEventListener('click', () => deleteFolderDialog.hide())

const shareFolderButton = document.querySelector('.share-folder-btn')
shareFolderButton.addEventListener('click', () => shareFolderDialog.show())

const closeShareFolderDialogButton = shareFolderDialog.querySelector('sl-button[slot="footer"]')
closeShareFolderDialogButton.addEventListener('click', () => shareFolderDialog.hide())

const closeshareFileDialogButton = shareFileDialog.querySelector('sl-button[slot="footer"]')
closeshareFileDialogButton.addEventListener('click', () => shareFileDialog.hide())

// File upload form
const uploadProgressBar = document.querySelector('.upload-progress')
const uploadForm = document.querySelector('.upload-form')
const fileInput = uploadForm.querySelector('input[type="file"]')
const fileError = document.getElementById('file-error')

// Validate file upload size
fileInput.onchange = function () {
  if (this.files[0].size > 52428800) {
    this.value = ''
    fileError.classList.add('active')
  } else {
    fileError.classList.remove('active')
  }
}

// Upload the file with feedback from xhr
uploadForm.addEventListener('submit', (event) => {
  event.preventDefault()
  uploadProgressBar.classList.add('active')
  const formData = new FormData(uploadForm)

  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/upload', true)

  xhr.upload.addEventListener('progress', (e) => {
    const percentComplete = Math.round((e.loaded / e.total) * 100)
    // The progress will init at 100 for small files but this will start the animation
    uploadProgressBar.value = percentComplete
    // Set indeterminate in case the server takes a while to respond.
    if (percentComplete === 100) {
      setTimeout(() => {
        uploadProgressBar.indeterminate = true
      }, 1000)
    }
  })
  xhr.addEventListener('load', () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      const responseUrl = xhr.responseURL
      window.location.href = responseUrl
    }
    newFileDialog.hide()
  })

  xhr.send(formData)
})

// Share file/folder dialogs
const shareFileRadioGroup = shareFileDialog.querySelector('sl-radio-group')
const shareFileRadioButtons = shareFileDialog.querySelectorAll('sl-radio-button')
const shareLinkContainer = shareFileDialog.querySelector('.share-link-container')
const generateLinkButton = shareFileDialog.querySelector('#generate-link-btn')
generateLinkButton.addEventListener('click', generatePublicFileUrl, { once: true })

const shareFolderRadioGroup = shareFolderDialog.querySelector('sl-radio-group')
const shareFolderRadioButtons = shareFolderDialog.querySelectorAll('sl-radio-button')
const shareFolderLinkContainer = shareFolderDialog.querySelector('.share-link-container')
const generateFolderLinkButton = shareFolderDialog.querySelector('#generate-folder-link-btn')
generateFolderLinkButton.addEventListener('click', generatePublicFolderUrl, { once: true })

async function generatePublicFileUrl() {
  const hoursDuration = shareFileRadioGroup.value
  const linkInput = document.createElement('sl-input')
  linkInput.classList.add('link-input')
  generateLinkButton.loading = true
  const res = await fetch(`share/file/${generateLinkButton.dataset.filename}?h=${hoursDuration}`)
  const data = await res.json()
  if (data.error) {
    window.alert(data.error)
    shareFolderDialog.hide()
  } else {
    const url = data.publicUrl
    linkInput.value = url
    shareLinkContainer.appendChild(linkInput)
    generateLinkButton.loading = false
    generateLinkButton.textContent = 'Copy Link'
    generateLinkButton.addEventListener('click', () => {
      navigator.clipboard.writeText(url)
      generateLinkButton.textContent = 'Copied!'
    })
    // Reset dialog on hide
    shareFileDialog.addEventListener(
      'sl-after-hide',
      () => {
        shareFileRadioButtons.forEach((button) => (button.disabled = false))
        linkInput.remove()
        generateLinkButton.textContent = 'Generate Link'
        generateLinkButton.addEventListener('click', generatePublicFolderUrl, { once: true })
      },
      { once: true }
    )
  }
}

async function generatePublicFolderUrl() {
  const hoursDuration = shareFolderRadioGroup.value
  const linkInput = document.createElement('sl-input')
  linkInput.classList.add('link-input')
  generateFolderLinkButton.loading = true
  const res = await fetch(`share/folder/${generateFolderLinkButton.dataset.id}?h=${hoursDuration}`)
  const data = await res.json()
  if (data.error) {
    window.alert(data.error)
    shareFolderDialog.hide()
  } else {
    const url = data.publicUrl
    linkInput.value = url
    shareFolderLinkContainer.appendChild(linkInput)
    generateFolderLinkButton.loading = false
    shareFolderRadioButtons.forEach((button) => (button.disabled = true))
    generateFolderLinkButton.textContent = 'Copy Link'
    generateFolderLinkButton.addEventListener('click', () => {
      navigator.clipboard.writeText(url)
      generateFolderLinkButton.textContent = 'Copied!'
    })
    // Reset dialog on hide
    shareFolderDialog.addEventListener(
      'sl-after-hide',
      () => {
        shareFolderRadioButtons.forEach((button) => (button.disabled = false))
        linkInput.remove()
        generateFolderLinkButton.textContent = 'Generate Link'
        generateFolderLinkButton.addEventListener('click', generatePublicFolderUrl, { once: true })
      },
      { once: true }
    )
  }
}
