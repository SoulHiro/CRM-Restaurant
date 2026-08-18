'use client'

let assinaturaConfigurada = false

/**
 * Certificado + assinatura por requisição (SHA512withRSA, gerados no
 * servidor via `lib/qz-signing.ts`) — sem isso, o QZ Tray pergunta
 * "Allow/Block" a cada `qz.print()` individual, não só uma vez por sessão.
 * Com um certificado confiado, a primeira aprovação vale pras próximas.
 */
function configurarAssinatura(qz: Awaited<typeof import('qz-tray')>['default']) {
  if (assinaturaConfigurada) return
  assinaturaConfigurada = true

  qz.security.setCertificatePromise(async () => {
    const resposta = await fetch('/api/qz/cert')
    return resposta.text()
  })

  qz.security.setSignaturePromise((paraAssinar) => (resolve, reject) => {
    fetch('/api/qz/sign', { method: 'POST', body: paraAssinar })
      .then((resposta) => resposta.text())
      .then(resolve)
      .catch(reject)
  })

  qz.security.setSignatureAlgorithm('SHA512')
}

/**
 * Ponte com o agente local QZ Tray — só existe no navegador, nunca no
 * servidor. Mesmo assinado, a primeiríssima conexão ainda pede pro usuário
 * aprovar o certificado uma vez na janela do QZ Tray; isso só acontece na
 * máquina do restaurante, não dá pra verificar remotamente.
 */
async function conectar() {
  const { default: qz } = await import('qz-tray')
  configurarAssinatura(qz)

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }

  return qz
}

/**
 * Nomes de impressora exatamente como o QZ Tray os enxerga no sistema
 * operacional — é esse nome, não o do Windows, que `qz.print()` espera.
 */
export async function listarImpressorasDetectadas(): Promise<string[]> {
  const qz = await conectar()
  return qz.printers.find()
}

async function blobParaBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario)
}

/**
 * Núcleo único da impressão — conecta, resolve a impressora e manda um
 * `qz.print()` por PDF, aguardado em sequência, nunca em lote. É isso que
 * faz a guilhotina da Elgin i9 cortar entre um documento e o próximo: um
 * trabalho de impressão só teria tudo na mesma folha contínua. Com um único
 * PDF (resumo do dia) o laço roda uma vez só — mesmo caminho, sem código
 * duplicado entre os dois usos.
 */
interface TamanhoMM {
  largura: number
  altura: number
}

async function imprimirSequencialmente(
  identificadorImpressora: string,
  pdfBlobs: Blob[],
  onProgresso?: (indice: number, total: number) => void,
  tamanhoMM?: TamanhoMM
): Promise<void> {
  if (pdfBlobs.length === 0) return

  const qz = await conectar()
  // Sem `size`, o driver decide a medida física a partir do PDF por conta
  // própria — pra uma página customizada fora do comum (uma nota de
  // fechamento itemizada pode ter qualquer altura), alguns drivers encolhem
  // a página inteira (largura incluída) pra caber numa medida que já
  // conhecem, em vez de simplesmente usar a que veio. Informar `size`
  // explicitamente evita essa adivinhação.
  const config = qz.configs.create(
    identificadorImpressora,
    tamanhoMM
      ? {
          size: { width: tamanhoMM.largura, height: tamanhoMM.altura },
          units: 'mm',
        }
      : undefined
  )

  for (let i = 0; i < pdfBlobs.length; i++) {
    const base64 = await blobParaBase64(pdfBlobs[i]!)
    await qz.print(config, [
      { type: 'pixel', format: 'pdf', flavor: 'base64', data: base64 },
    ])
    onProgresso?.(i + 1, pdfBlobs.length)
  }
}

/** Um documento só — nota de fechamento do dia, por exemplo. */
export async function imprimirDocumentoUnico(
  identificadorImpressora: string,
  pdfBlob: Blob,
  tamanhoMM?: TamanhoMM
): Promise<void> {
  await imprimirSequencialmente(
    identificadorImpressora,
    [pdfBlob],
    undefined,
    tamanhoMM
  )
}

/** Vários documentos, um trabalho de impressão por vez — comandas, por exemplo. */
export async function imprimirDocumentosSequencialmente(
  identificadorImpressora: string,
  pdfBlobs: Blob[],
  onProgresso?: (indice: number, total: number) => void
): Promise<void> {
  await imprimirSequencialmente(identificadorImpressora, pdfBlobs, onProgresso)
}
