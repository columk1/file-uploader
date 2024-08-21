await Promise.allSettled([
  customElements.whenDefined('sl-button'),
  customElements.whenDefined('sl-icon-button'),
  customElements.whenDefined('sl-drawer'),
  customElements.whenDefined('sl-dialog'),
  customElements.whenDefined('sl-tree'),
  customElements.whenDefined('sl-tree-item'),
])

document.body.style.display = 'block'

const dataScript = document.getElementById('data-script')
const files = JSON.parse(dataScript.textContent)

const overlay = document.querySelector('.overlay')
const dialogs = document.querySelectorAll('sl-dialog')
const treeItems = document.querySelectorAll('sl-tree-item')

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
    downloadButton.href = `/public/<%= id %>/download/${file.id}?filename=${file.name}&mimeType=${file.mimeType}`
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

function createFileInfoElement(label, value) {
  const fileInfoItem = document.createElement('div')
  fileInfoItem.classList.add('file-info-item')

  const labelElement = document.createElement('strong')
  labelElement.textContent = label

  const valueElement = document.createElement('span')
  valueElement.classList.add('file-info-value')
  valueElement.textContent = value

  fileInfoItem.appendChild(labelElement)
  fileInfoItem.appendChild(valueElement)

  return fileInfoItem
}

function createFileInfoContent(file) {
  const drawerContent = document.createElement('div')

  const name = document.createElement('p')
  const nameLabel = document.createElement('strong')
  const nameValue = document.createElement('span')
  nameLabel.textContent = 'Name: '
  nameValue.textContent = file.name
  name.append(nameLabel, nameValue)

  const mimeType = document.createElement('p')
  const typeLabel = document.createElement('strong')
  const typeValue = document.createElement('span')
  typeLabel.textContent = 'Type: '
  typeValue.textContent = file.mimeType
  mimeType.append(typeLabel, typeValue)

  const size = document.createElement('p')
  const sizeLabel = document.createElement('strong')
  const sizeValue = document.createElement('sl-format-bytes')
  sizeLabel.textContent = 'Size: '
  sizeValue.value = file.size
  size.append(sizeLabel, sizeValue)

  const dateCreated = document.createElement('p')
  const dateLabel = document.createElement('strong')
  const dateValue = document.createElement('span')
  const date = new Date(file.createdAt)
  dateLabel.textContent = 'Created: '
  console.log(file.createdAt)
  dateValue.textContent =
    formatDate(new Date(file.createdAt)) +
    `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  dateCreated.append(dateLabel, dateValue)

  drawerContent.append(name, mimeType, size, dateCreated)

  return drawerContent
}
