function generateSortLink(prevSortQuery: Record<string, string>, field: string) {
  const direction = prevSortQuery[field] === 'asc' ? '-' : ''
  const newSortQuery = `${direction}${field}`

  return `?sort=${newSortQuery}`
}

const getIcon = (currentSort: string | undefined, field: string): string => {
  return currentSort === `-${field}` ? 'caret-down' : 'caret-up'
}

const formatDate = (timestamp: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(timestamp)
}

const helpers = {
  generateSortLink,
  getIcon,
  formatDate,
}

export default helpers
