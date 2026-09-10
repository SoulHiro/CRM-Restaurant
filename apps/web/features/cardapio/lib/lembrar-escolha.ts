import type { TurnoRefeicao } from './types'

interface EscolhaSalva {
  turno: TurnoRefeicao
  colaboradorId: string
}

/**
 * Só conveniência, não autenticação — o mesmo nível de confiança de sempre
 * (escolher o próprio nome numa lista) continua valendo, isso aqui só evita
 * repetir a escolha toda vez que a pessoa reabre o link, inclusive depois
 * de virar o mês. Guardado por empresa: quem responde pra mais de uma
 * empresa no mesmo aparelho não tem uma escolha pisando na outra.
 */
function chave(empresaId: string): string {
  return `cardapio:${empresaId}:escolha`
}

export function salvarEscolha(empresaId: string, escolha: EscolhaSalva): void {
  try {
    localStorage.setItem(chave(empresaId), JSON.stringify(escolha))
  } catch {
    // Storage bloqueado (modo privado, cota cheia) — degrada pra "sempre
    // escolher de novo", sem quebrar o resto do formulário.
  }
}

export function carregarEscolha(empresaId: string): EscolhaSalva | null {
  try {
    const bruto = localStorage.getItem(chave(empresaId))
    return bruto ? (JSON.parse(bruto) as EscolhaSalva) : null
  } catch {
    return null
  }
}
