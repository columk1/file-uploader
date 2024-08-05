import { z } from 'zod'

const EntitySchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  type: z.enum(['FILE', 'FOLDER']),
  size: z.number().int().nonnegative().nullable(),
  mimeType: z.string().nullable(),
  parentId: z.number().int().nonnegative().nullable(),
  userId: z.number().int().nonnegative(),
})

const NewEntitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FILE', 'FOLDER']),
  size: z.number().int().nonnegative().nullable(),
  mimeType: z.string().nullable(),
  parentId: z.number().int().nonnegative().nullable(),
  userId: z.number().int().nonnegative(),
})

const UserSchema = z.object({
  id: z.number().int().nonnegative(),
  username: z.string().min(3).max(36),
  password: z.string().min(8).max(254),
  documents: z.array(EntitySchema),
})

const SignUpSchema = z.object({
  username: z.string().trim().min(3, { message: 'Username must be at least 3 characters' }).max(36),
  password: z
    .string()
    .trim()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(254, { message: 'Password must be at most 254 characters' }),
})

export { EntitySchema, NewEntitySchema, UserSchema, SignUpSchema }
