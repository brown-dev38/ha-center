import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type { ZodType, ZodTypeDef } from 'zod'

/**
 * zodResolver typed wrapper — avoids Zod 3.25 vs @hookform/resolvers type mismatch in IDE.
 */
export function formResolver<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues, ZodTypeDef, unknown>
): Resolver<TFieldValues> {
  return zodResolver(schema as never) as Resolver<TFieldValues>
}
