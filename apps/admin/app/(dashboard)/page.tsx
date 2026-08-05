import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = (session?.user as any)?.role

  if (role === 'financeiro') redirect('/placar')
  redirect('/caixa')
}
