import { assinarRequisicaoQz } from '@/lib/qz-signing'

export async function POST(request: Request) {
  const paraAssinar = await request.text()

  try {
    const assinatura = assinarRequisicaoQz(paraAssinar)
    return new Response(assinatura, {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    // Mesma lógica do /api/qz/cert: sem status de erro explícito, uma chave
    // mal formatada vira "assinatura" inválida enviada ao QZ Tray sem
    // nenhum aviso — a verificação falha do lado do QZ Tray sem pista de
    // onde procurar.
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(mensagem, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
