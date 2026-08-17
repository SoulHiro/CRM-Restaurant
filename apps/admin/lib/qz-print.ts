'use client'

/**
 * Ponte com o agente local QZ Tray — só existe no navegador, nunca no
 * servidor. A primeira conexão pede pro usuário autorizar o certificado
 * (não assinado) na própria janela do QZ Tray; isso só acontece na máquina
 * do restaurante, não dá pra verificar remotamente.
 */
async function conectar() {
  const { default: qz } = await import('qz-tray')

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect()
  }

  return qz
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
