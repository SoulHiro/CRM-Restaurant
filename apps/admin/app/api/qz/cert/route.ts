import { obterCertificadoQz } from '@/lib/qz-signing'

export async function GET() {
  try {
    return new Response(obterCertificadoQz(), {
      headers: { 'Content-Type': 'text/plain' },
    })
  } catch (error) {
    // Sem isso, um erro aqui (ex: env não configurada em produção) vira uma
    // página de erro HTML devolvida com status 200 pro QZ Tray, que a trata
    // como se fosse o certificado — falha muda, sem nada pra depurar.
    const mensagem = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(mensagem, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
}
