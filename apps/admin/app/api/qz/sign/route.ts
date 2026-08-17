import { assinarRequisicaoQz } from '@/lib/qz-signing'

export async function POST(request: Request) {
  const paraAssinar = await request.text()
  const assinatura = assinarRequisicaoQz(paraAssinar)

  return new Response(assinatura, {
    headers: { 'Content-Type': 'text/plain' },
  })
}
