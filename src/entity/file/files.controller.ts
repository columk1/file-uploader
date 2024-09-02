import type { RequestHandler } from 'express'
import createError from 'http-errors'
import { deleteEntityById, getFileById } from '@/entity/entities.repository'
import { uploadFile } from '@/entity/file/files.service'
import { defaultErrorQuery } from '@/lib/utils/errorMessages'
import { storage } from '@/storage/storage.repository'

// POST: /files Upload a file
export const handleFileUpload: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    // req.file is the name of the user's file in the form, 'uploaded_file'
    const { file } = req
    const parentId = Number(req.body.parentId) || null

    const { data, error } = await uploadFile(userId, parentId, file)
    if (error) {
      return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(error.message)}`)
    }
    res.redirect(`/folders/${parentId}`)
  } catch (error) {
    next(error)
  }
}

// DELETE: /files/:fileId
export const handleDeleteFile: RequestHandler = async (req, res, next) => {
  try {
    const fileId = Number(req.params.fileId)
    const userId = req.user?.id

    if (!userId) throw new createError.Unauthorized()

    const file = await getFileById(fileId)
    if (!file) throw new createError.NotFound()

    const { name, parentId } = file
    await deleteEntityById(fileId)

    res.redirect(`/folders/${parentId}?success=${encodeURIComponent('Deleted Successfully')}`)

    // Continue to remove from storage
    const bucketName = process.env.SUPABASE_BUCKET || ''
    process.nextTick(() => storage.deleteFile(bucketName, `${userId}/${name}`))
  } catch (err) {
    next(err)
  }
}

// GET: /files/download/:fileId
export const handleFileDownload: RequestHandler = async (req, res, next) => {
  try {
    const fileId = Number(req.params.fileId)
    const file = await getFileById(fileId)

    if (!file) throw new createError.NotFound()

    const { name: filename, parentId } = file
    const filePath = `${req.user?.id}/${filename}`

    const fileDownloadUrl = await storage.getFileUrl(filePath, 60, { download: true })

    if (fileDownloadUrl) {
      res.redirect(fileDownloadUrl)
    } else {
      res.redirect(`/${parentId}?error=${defaultErrorQuery}`)
    }
  } catch (err) {
    next(err)
  }
}
