import { cn } from './cn'

type VariantsSchema = Record<string, Record<string, string>>

type VariantSelection<T extends VariantsSchema> = {
  [K in keyof T]?: keyof T[K]
}

interface VariantConfig<T extends VariantsSchema> {
  variants?: T
  defaultVariants?: VariantSelection<T>
}

export function cva<T extends VariantsSchema>(base: string, config?: VariantConfig<T>) {
  return (selection?: VariantSelection<T> & { className?: string }) => {
    const mergedSelection = {
      ...(config?.defaultVariants ?? {}),
      ...(selection ?? {}),
    } as VariantSelection<T>

    const variantClasses = config?.variants
      ? Object.entries(config.variants).map(([variantName, options]) => {
          const selectedOption = mergedSelection[variantName as keyof T]
          if (!selectedOption) {
            return ''
          }

          return options[selectedOption as string] ?? ''
        })
      : []

    return cn(base, ...variantClasses, selection?.className)
  }
}
