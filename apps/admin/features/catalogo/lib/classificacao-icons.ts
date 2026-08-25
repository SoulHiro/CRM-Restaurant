import {
  CandyOff,
  Droplet,
  Flame,
  Leaf,
  MilkOff,
  Snowflake,
  Sparkles,
  Sprout,
  WheatOff,
  Wine,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Ícones curados pra classificação de produto — o admin escolhe um destes
 * ao criar uma classificação nova, em vez de qualquer ícone da biblioteca.
 * Mantém a tela previsível e evita ícone fora do padrão visual.
 */
export const CLASSIFICACAO_ICON_OPTIONS = [
  { key: 'leaf', icon: Leaf, label: 'Folha' },
  { key: 'sprout', icon: Sprout, label: 'Broto' },
  { key: 'wheat-off', icon: WheatOff, label: 'Sem glúten' },
  { key: 'candy-off', icon: CandyOff, label: 'Sem açúcar' },
  { key: 'milk-off', icon: MilkOff, label: 'Sem lactose' },
  { key: 'flame', icon: Flame, label: 'Picante' },
  { key: 'snowflake', icon: Snowflake, label: 'Gelada' },
  { key: 'wine', icon: Wine, label: 'Alcoólica' },
  { key: 'sparkles', icon: Sparkles, label: 'Diet/Zero' },
  { key: 'droplet', icon: Droplet, label: 'Natural' },
] as const

export type ClassificacaoIconKey =
  (typeof CLASSIFICACAO_ICON_OPTIONS)[number]['key']

export const CLASSIFICACAO_ICON_KEYS = CLASSIFICACAO_ICON_OPTIONS.map(
  (option) => option.key
) as [ClassificacaoIconKey, ...ClassificacaoIconKey[]]

export const CLASSIFICACAO_ICON_MAP: Record<ClassificacaoIconKey, LucideIcon> =
  Object.fromEntries(
    CLASSIFICACAO_ICON_OPTIONS.map((option) => [option.key, option.icon])
  ) as Record<ClassificacaoIconKey, LucideIcon>
