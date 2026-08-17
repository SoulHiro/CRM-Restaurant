import { obterCertificadoQz } from '@/lib/qz-signing'

export async function GET() {
  return new Response(obterCertificadoQz(), {
    headers: { 'Content-Type': 'text/plain' },
  })
}
