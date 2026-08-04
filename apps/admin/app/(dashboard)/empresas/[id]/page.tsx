import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { Button } from "@repo/ui/components/button"

import { mockEmpresas } from "../mock-empresas"

export default async function EmpresaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const empresa = mockEmpresas.find((item) => item.id === id)

  if (!empresa) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/empresas">
          <ArrowLeft className="size-4" />
          Voltar
        </Link>
      </Button>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{empresa.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Página de detalhes da empresa — em construção.
        </p>
      </div>
    </div>
  )
}
