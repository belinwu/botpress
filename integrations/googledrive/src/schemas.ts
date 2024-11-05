import { z } from '@botpress/sdk'

const hasId = z.object({
  id: z.string().min(1),
})
export const fileAttrSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
  mimeType: z.string().min(1),
  path: z.string().min(1),
})
export const creatableFileAttrSchema = fileAttrSchema.omit({
  path: true, // Computed from individual files received by API
})
export const updatableFileAttrSchema = creatableFileAttrSchema.omit({
  mimeType: true, // Content type cannot be changed unless new content is uploaded
})
export const fileSchema = hasId.merge(fileAttrSchema)
export const fileCreateArgSchema = creatableFileAttrSchema
export const fileUpdateArgSchema = hasId.merge(updatableFileAttrSchema.partial())
// URL is used instead of ID because an integration can't access all files of a bot
// using the files API
export const fileUploadDataArgSchema = hasId.merge(
  z.object({
    url: z
      .string()
      .min(1)
      .describe('The URL used to access the file whose content will be uploaded to the Google Drive.'),
    mimeType: z
      .string()
      .min(1)
      .optional()
      .describe('Media type of the uploaded content. This will override any previously set media type.'),
  })
)

export const folderSchema = fileSchema
