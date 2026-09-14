import { Beef, Drumstick, Fish, Ham, Salad, UtensilsCrossed, Wheat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const CATEGORIAS_PRATO = [
  'aves',
  'bovinos',
  'suinos',
  'peixes',
  'massas',
  'saladas',
  'outros',
] as const

export type CategoriaPrato = (typeof CATEGORIAS_PRATO)[number]

export const CATEGORIA_PRATO_LABEL: Record<CategoriaPrato, string> = {
  aves: 'Aves',
  bovinos: 'Bovinos',
  suinos: 'Suínos',
  peixes: 'Peixes',
  massas: 'Massas',
  saladas: 'Saladas',
  outros: 'Outros',
}

export const CATEGORIA_PRATO_ICON: Record<CategoriaPrato, LucideIcon> = {
  aves: Drumstick,
  bovinos: Beef,
  suinos: Ham,
  peixes: Fish,
  massas: Wheat,
  saladas: Salad,
  outros: UtensilsCrossed,
}
