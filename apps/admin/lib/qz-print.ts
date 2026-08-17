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
 * Um `qz.print()` por PDF, aguardado em sequência — nunca em lote. É isso
 * que faz a guilhotina da Elgin i9 cortar entre uma comanda e a próxima: um
 * trabalho de impressão só teria todas as comandas na mesma folha contínua.
 */
export async function imprimirComandasSequencial(
  identificadorImpressora: string,
  pdfBlobs: Blob[],
  onProgresso?: (indice: number, total: number) => void
): Promise<void> {
  if (pdfBlobs.length === 0) return

  const qz = await conectar()
  const config = qz.configs.create(identificadorImpressora)

  for (let i = 0; i < pdfBlobs.length; i++) {
    const base64 = await blobParaBase64(pdfBlobs[i]!)
    await qz.print(config, [
      { type: 'pixel', format: 'pdf', flavor: 'base64', data: base64 },
    ])
    onProgresso?.(i + 1, pdfBlobs.length)
  }
}
