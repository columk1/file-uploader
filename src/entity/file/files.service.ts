import { storage } from 'src/storage/storage.repository'
import { Readable } from 'stream'
import { defaultErrorQuery } from 'src/lib/utils/errorMessages'
import { createFile } from 'src/entity/entities.repository'

export const uploadFile = async (
  userId: number,
  parentId: number | null,
  file?: Express.Multer.File
) => {
  if (!file) {
    return { data: null, error: new Error('No file provided') }
  }

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
      // duplicate or maximum size exceeded
      if (error.statusCode === 409 || error.statusCode === 413) {
        return { data: null, error: new Error(error.message) }
      }
    }
    return { data: null, error: new Error(defaultErrorQuery) }
  }
  // add to database
  await createFile(originalname, mimetype, size, userId, parentId)
  return { data, error: null }
}
