import { somarDiasISO } from '@/lib/dates'

export interface PratoCatalogoItem {
  id: string
  nome: string
}

export interface DiaFixo {
  data: string
  pratoId: string
}

export interface CardapioDiaGerado {
  destaqueId: string
  alternativaIds: string[]
}

/** Fisher-Yates — `rng` injetável só pra deixar o teste determinístico, sem depender de `Math.random`. */
function embaralhar<T>(itens: readonly T[], rng: () => number): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j]!, copia[i]!]
  }
  return copia
}

/**
 * Sorteia o cardápio de um mês inteiro pra uma empresa: dia fixo (quarta e
 * sábado = feijoada, por regra do sistema) sempre usa o prato configurado
 * como destaque; os demais dias sorteiam um destaque sem repetir dentro do
 * mês, enquanto o catálogo aguentar — se o catálogo for menor que a
 * quantidade de dias livres, passa a repetir (o admin vê isso no preview
 * antes de confirmar, não é um erro silencioso). Alternativas sorteiam do
 * resto do catálogo (excluindo o destaque daquele dia), também sem repetir
 * dentro do mesmo dia.
 */
export function gerarCardapioMes(
  pratos: readonly PratoCatalogoItem[],
  dias: readonly string[],
  diasFixos: readonly DiaFixo[],
  itensPorDia: number,
  rng: () => number = Math.random
): Map<string, CardapioDiaGerado> {
  const fixoPorData = new Map(diasFixos.map((d) => [d.data, d.pratoId]))
  const idsCatalogo = pratos.map((p) => p.id)

  const destaquesJaUsados = new Set(diasFixos.map((d) => d.pratoId))
  const filaLivres = embaralhar(
    idsCatalogo.filter((id) => !destaquesJaUsados.has(id)),
    rng
  )
  let cursorFila = 0

  function proximoDestaqueLivre(): string {
    if (filaLivres.length === 0) return idsCatalogo[0]!
    const id = filaLivres[cursorFila % filaLivres.length]!
    cursorFila++
    return id
  }

  const resultado = new Map<string, CardapioDiaGerado>()

  for (const data of dias) {
    const destaqueId = fixoPorData.get(data) ?? proximoDestaqueLivre()

    const restante = embaralhar(
      idsCatalogo.filter((id) => id !== destaqueId),
      rng
    )
    const alternativaIds = restante.slice(0, Math.max(0, itensPorDia - 1))

    resultado.set(data, { destaqueId, alternativaIds })
  }

  return resultado
}

/** Segunda a sábado do intervalo (inclusive) — domingo nunca é dia de cardápio. */
export function diasSegundaASabado(from: string, to: string): string[] {
  const dias: string[] = []
  let atual = from
  while (atual <= to) {
    const diaSemana = new Date(`${atual}T00:00:00Z`).getUTCDay()
    if (diaSemana !== 0) dias.push(atual)
    atual = somarDiasISO(atual, 1)
  }
  return dias
}

const DIAS_FIXOS_SEMANA_FEIJOADA = [3, 6] // 0=domingo ... 3=quarta, 6=sábado

/**
 * Toda quarta e sábado do intervalo viram dia fixo de feijoada — regra do
 * sistema (não mais dependente de planilha por empresa). `pratoFeijoadaId`
 * precisa existir no catálogo da empresa (o admin cadastra "Feijoada" uma
 * vez, igual aos outros pratos).
 */
export function diasFixosFeijoada(
  dias: readonly string[],
  pratoFeijoadaId: string
): DiaFixo[] {
  return dias
    .filter((data) => {
      const diaSemana = new Date(`${data}T00:00:00Z`).getUTCDay()
      return DIAS_FIXOS_SEMANA_FEIJOADA.includes(diaSemana)
    })
    .map((data) => ({ data, pratoId: pratoFeijoadaId }))
}
