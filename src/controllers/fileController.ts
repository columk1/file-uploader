import { createFile, getFileById, deleteEntityById } from 'src/services/entityService'
import { NextFunction, Request, Response } from 'express'
import { Readable } from 'stream'
import createError from 'http-errors'
import { defaultError, defaultErrorQuery } from 'src/lib/utils/errorMessages'
import { storage } from 'src/services/storageService'

// POST: /files Upload a file
export const handleFileUpload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id
    if (!userId) throw new createError.Unauthorized()

    // req.file is the name of the user's file in the form, 'uploaded_file'
    const file = req.file
    const parentId = Number(req.body.parentId) || null
    if (!file) return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(defaultError)}`)

    const { originalname, mimetype, size, buffer } = file

    const bucketName = 'files'
    const options = {
      contentType: mimetype,
      upsert: false,
      duplex: 'half' as 'half' | 'full', // allows binary stream, otherwise must convert: decode(buffer.toString('base64')
    }
    const filePath = `${userId}/${originalname}`

    const bufferStream = new Readable()
    bufferStream.push(buffer)
    bufferStream.push(null) // end of stream

    const { data, error } = await storage.uploadFile(bucketName, filePath, bufferStream, options)

    if (error) {
      console.log(error)
      if ('statusCode' in error) {
        if (error.statusCode === '409') {
          // duplicate file
          return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(error.message)}`)
        } else if (error.statusCode === '413') {
          // file size limit exceeded
          return res.redirect(`/folders/${parentId}?error=${encodeURIComponent(error.message)}`)
        }
      }
      return res.redirect(`/folders/${parentId}?error=${defaultErrorQuery}`)
    }

    // add to database
    await createFile(originalname, mimetype, size, userId, parentId)

    res.redirect('/folders/' + parentId)
  } catch (error) {
    next(error)
  }
}

// DELETE: /files/:fileId
export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
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
    const deletedFile = storage.deleteFile('files', `${userId}/${name}`)
  } catch (err) {
    next(err)
  }
}

// GET: /files/download/:fileId
export const handleFileDownload = async (req: Request, res: Response, next: NextFunction) => {
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
