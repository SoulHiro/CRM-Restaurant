import 'server-only'

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITMO = 'aes-256-gcm'
const TAMANHO_IV = 12
const TAMANHO_CHAVE = 32

/**
 * Lida a cada chamada, não no topo do módulo: `next build` importa este
 * arquivo sem a env carregada, e falhar no import quebraria o build inteiro
 * por causa de um campo opcional.
 */
function lerChave(): Buffer {
  const bruta = process.env.CPF_ENCRYPTION_KEY
  if (!bruta) {
    throw new Error('CPF_ENCRYPTION_KEY não está definida')
  }

  const chave = Buffer.from(bruta, 'base64')
  if (chave.length !== TAMANHO_CHAVE) {
    throw new Error(
      `CPF_ENCRYPTION_KEY precisa ter ${TAMANHO_CHAVE} bytes em base64`
    )
  }
  return chave
}

/**
 * AES-256-GCM. O `iv` e a `authTag` viajam no próprio blob, então uma coluna
 * `text` guarda tudo — e a tag é o que faz `decifrar` recusar um valor
 * adulterado no banco em vez de devolver lixo.
 */
export function cifrar(texto: string): string {
  const iv = randomBytes(TAMANHO_IV)
  const cipher = createCipheriv(ALGORITMO, lerChave(), iv)
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()])

  return [
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    cifrado.toString('base64'),
  ].join('.')
}

export function decifrar(blob: string): string {
  const partes = blob.split('.')
  if (partes.length !== 3) {
    throw new Error('Valor cifrado em formato inválido')
  }

  const [iv, tag, dados] = partes as [string, string, string]
  const decipher = createDecipheriv(
    ALGORITMO,
    lerChave(),
    Buffer.from(iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(tag, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(dados, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
