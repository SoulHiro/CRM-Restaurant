/**
 * Formatação e validação de CPF — puro, sem segredo nenhum, então roda também
 * no cliente. Cifrar/decifrar mora em `lib/crypto.ts`, que é server-only.
 */

/** Só os dígitos — máscara digitada pelo usuário não vai para o banco. */
export function digitosDoCpf(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Últimos 5 dígitos. É o suficiente para a tela mostrar `•••.•••.123-45` e
 * para buscar sem decifrar a tabela inteira, e curto o bastante para não
 * identificar ninguém sozinho.
 */
export function finalDoCpf(cpf: string): string {
  return digitosDoCpf(cpf).slice(-5)
}

export function mascararCpf(final: string | null): string {
  if (!final || final.length < 5) return '—'
  return `•••.•••.${final.slice(0, 3)}-${final.slice(3)}`
}

export function formatarCpf(cpf: string): string {
  const digitos = digitosDoCpf(cpf)
  if (digitos.length !== 11) return cpf
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

/**
 * Validação real pelos dígitos verificadores, não só contagem de caracteres:
 * um CPF errado só aparece no contracheque, meses depois.
 */
export function cpfValido(cpf: string): boolean {
  const digitos = digitosDoCpf(cpf)
  if (digitos.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digitos)) return false

  for (const [tamanho, posicao] of [
    [9, 9],
    [10, 10],
  ] as const) {
    let soma = 0
    for (let i = 0; i < tamanho; i++) {
      soma += Number(digitos[i]) * (tamanho + 1 - i)
    }
    const resto = (soma * 10) % 11
    const esperado = resto === 10 ? 0 : resto
    if (esperado !== Number(digitos[posicao])) return false
  }

  return true
}
