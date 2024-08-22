import { createFileInfoContent } from './createFileInfoContent.js'

await Promise.allSettled([
  customElements.whenDefined('sl-button'),
  customElements.whenDefined('sl-icon'),
  customElements.whenDefined('sl-icon-button'),
  customElements.whenDefined('sl-drawer'),
  customElements.whenDefined('sl-tree'),
  customElements.whenDefined('sl-tree-item'),
  customElements.whenDefined('sl-breadcrumb'),
  customElements.whenDefined('sl-breadcrumb-item'),
])

// Show body
document.body.style.display = 'block'

const dataScript = document.getElementById('data-script')
const files = JSON.parse(dataScript.textContent)

const dataContainer = document.getElementById('data-container')
const sharedFolderId = dataContainer.getAttribute('data-id')

// File info drawer
const drawer = document.querySelector('.drawer-overview')
const drawerContent = document.querySelector('.drawer-content')
const openButtons = document.querySelectorAll('.btn.grid-row[data-index]')
const downloadButton = drawer.querySelector('.drawer-download-btn')

openButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const index = button.getAttribute('data-index')
    const file = files[index]
    const newDrawerContent = createFileInfoContent(file)

    // Repopulate drawer with file info
    drawerContent.replaceChildren(newDrawerContent)
    downloadButton.href = `/public/${sharedFolderId}/download/${file.id}?filename=${file.name}&mimeType=${file.mimeType}`
    downloadButton.addEventListener('click', function () {
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 2000)
    })

    // Show the drawer
    drawer.show()
  })
})
const closeButton = drawer.querySelector('.drawer-close-btn')
closeButton.addEventListener('click', () => drawer.hide())
