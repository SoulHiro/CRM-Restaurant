import 'server-only'

import { db } from '@/lib/db'

import {
  CAMPOS_COMANDA_PADRAO,
  TODOS_CAMPOS_COMANDA,
  type CampoComandaKey,
  type ConfiguracaoComanda,
} from './types'

function ehCampoValido(valor: string): valor is CampoComandaKey {
  return (TODOS_CAMPOS_COMANDA as string[]).includes(valor)
}

/**
 * Singleton (`id = 'default'`) — sem linha ainda, devolve o padrão em
 * memória, sem gravar nada. Só grava quando o usuário salva pela primeira
 * vez em Configurações.
 */
export async function getConfiguracaoComanda(): Promise<ConfiguracaoComanda> {
  const row = await db.query.configuracaoComanda.findFirst({
    where: (c, { eq }) => eq(c.id, 'default'),
  })

  if (!row) return { campos: CAMPOS_COMANDA_PADRAO }

  const campos = row.campos.filter(ehCampoValido)
  return { campos: campos.length > 0 ? campos : CAMPOS_COMANDA_PADRAO }
}
