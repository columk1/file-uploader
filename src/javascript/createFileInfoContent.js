const createFileInfoElement = (label, value) => {
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

export const createFileInfoContent = (file) => {
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
  dateValue.textContent = `${formatDate(new Date(file.createdAt))}, ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
  dateCreated.append(dateLabel, dateValue)

  drawerContent.append(name, mimeType, size, dateCreated)

  return drawerContent
}
