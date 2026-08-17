import 'server-only'

import { createSign } from 'node:crypto'

/**
 * Lida a cada chamada, não no topo do módulo: `next build` importa este
 * arquivo sem a env carregada, e falhar no import quebraria o build inteiro
 * por causa de um campo opcional.
 */
function lerEnv(nome: string): string {
  const valor = process.env[nome]
  if (!valor) throw new Error(`${nome} não está definida`)
  return valor.replace(/\\n/g, '\n')
}

/**
 * Assina uma requisição do QZ Tray (SHA512withRSA) — é isso que faz o QZ
 * Tray parar de perguntar "Allow/Block" a cada `qz.print()`: com um
 * certificado assinado e confiado uma vez, ele confia nas próximas
 * automaticamente, sem popup por trabalho de impressão.
 */
export function assinarRequisicaoQz(paraAssinar: string): string {
  const chavePrivada = lerEnv('QZ_SIGNING_PRIVATE_KEY')
  const assinador = createSign('SHA512')
  assinador.update(paraAssinar)
  assinador.end()
  return assinador.sign(chavePrivada, 'base64')
}

export function obterCertificadoQz(): string {
  return lerEnv('QZ_SIGNING_CERTIFICATE')
}
