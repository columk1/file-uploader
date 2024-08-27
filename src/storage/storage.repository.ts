import type { Readable } from 'node:stream'
import supabaseAdmin from 'src/database/supabaseAdminClient'

const uploadFile = async (
  bucketName: string,
  filePath: string,
  bufferStream: Readable,
  options: { contentType: string; upsert: boolean; duplex: 'half' | 'full' }
) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, bufferStream, options)

  return { data, error }
}

const deleteFile = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabaseAdmin.storage.from(bucketName).remove([filePath])
  if (error) {
    console.log(error)
    return null
  }
  return data
}

const getFileUrl = async (
  filePath: string,
  expiresIn: number,
  options: { download?: boolean } = {}
) => {
  const { data, error } = await supabaseAdmin.storage
    .from('files')
    .createSignedUrl(filePath, expiresIn, options)

  if (error || !data.signedUrl) {
    console.log('Error creating signed URL', error)
    return null
  }
  return data.signedUrl
}

const getFileUploadUrl = async (bucketName: string, filePath: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(filePath) // URL valid for 60 seconds
  if (error) {
    console.log(error)
    return null
  }
  return data.signedUrl
}

export const storage = {
  uploadFile,
  deleteFile,
  getFileUrl,
  getFileUploadUrl,
}
