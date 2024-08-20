import { formatDate } from './formatDate.js'

import '@shoelace-style/shoelace/dist/themes/dark.css'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
import '@shoelace-style/shoelace/dist/components/icon/icon.js'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import '@shoelace-style/shoelace/dist/components/breadcrumb/breadcrumb.js'
import '@shoelace-style/shoelace/dist/components/breadcrumb-item/breadcrumb-item.js'
import '@shoelace-style/shoelace/dist/components/tree/tree.js'
import '@shoelace-style/shoelace/dist/components/tree-item/tree-item.js'
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import '@shoelace-style/shoelace/dist/components/format-bytes/format-bytes.js'
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js'
import '@shoelace-style/shoelace/dist/components/radio-group/radio-group.js'
import '@shoelace-style/shoelace/dist/components/radio-button/radio-button.js'
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js'
import '@shoelace-style/shoelace/dist/components/alert/alert.js'

import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'

setBasePath('/vendors/shoelace')

window.formatDate = formatDate

/* Icons */

// box-arrow-in-right
// copy
// file-earmark
// file-earmark-image
// file-earmark-music
// file-earmark-plus
// file-earmark-play
// folder
// folder-plus
// share
