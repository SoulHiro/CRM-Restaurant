'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

import { Button } from '@repo/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import { cn } from '@repo/ui/lib/utils'

import { PassoConfirmar } from './passo-confirmar'
import { PassoMapear } from './passo-mapear'
import { PassoRevisar } from './passo-revisar'
import { PassoUpload } from './passo-upload'
import {
  PASSOS,
  type MapeamentoColunas,
  type PassoImportacao,
  type PessoaRevisao,
  type PlanilhaLida,
  type ResultadoImportacao,
} from './importar-planilha-types'

export function ImportarPlanilhaDrawer({ empresaId }: { empresaId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [passo, setPasso] = useState<PassoImportacao>('upload')
  const [planilha, setPlanilha] = useState<PlanilhaLida | null>(null)
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas | null>(null)
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<Set<string>>(
    new Set()
  )
  const [pessoas, setPessoas] = useState<PessoaRevisao[]>([])
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  function reiniciar() {
    setPasso('upload')
    setPlanilha(null)
    setMapeamento(null)
    setSemanasSelecionadas(new Set())
    setPessoas([])
    setResultado(null)
  }

  function fechar() {
    setOpen(false)
    reiniciar()
    router.refresh()
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reiniciar()
      }}
    >
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-4" />
          Importar planilha
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction="right"
        variant="float"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-2xl"
      >
        <DrawerHeader>
          <DrawerTitle>Importar planilha de pedidos</DrawerTitle>
          <DrawerDescription>
            Cadastra colaboradores e o pedido de cada dia a partir da
            planilha de respostas.
          </DrawerDescription>
          <div className="mt-3 flex gap-2">
            {PASSOS.map((item, indice) => {
              const indiceAtual = PASSOS.findIndex((p) => p.id === passo)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'h-1 flex-1 rounded-full bg-muted',
                    indice <= indiceAtual && 'bg-primary'
                  )}
                />
              )
            })}
          </div>
        </DrawerHeader>

        {passo === 'upload' && (
          <PassoUpload
            onLida={(lida) => {
              setPlanilha(lida)
              setPasso('mapear')
            }}
          />
        )}

        {passo === 'mapear' && planilha && (
          <PassoMapear
            planilha={planilha}
            onConfirmar={(mapeamentoEscolhido, semanas) => {
              setMapeamento(mapeamentoEscolhido)
              setSemanasSelecionadas(semanas)
              setPasso('revisar')
            }}
            onVoltar={() => setPasso('upload')}
          />
        )}

        {passo === 'revisar' && planilha && mapeamento && (
          <PassoRevisar
            empresaId={empresaId}
            planilha={planilha}
            mapeamento={mapeamento}
            semanasSelecionadas={semanasSelecionadas}
            onConfirmar={(pessoasRevisadas) => {
              setPessoas(pessoasRevisadas)
              setPasso('confirmar')
            }}
            onVoltar={() => setPasso('mapear')}
          />
        )}

        {passo === 'confirmar' && planilha && (
          <PassoConfirmar
            empresaId={empresaId}
            arquivoNome={planilha.arquivoNome}
            pessoas={pessoas}
            resultado={resultado}
            onImportado={setResultado}
            onVoltar={() => setPasso('revisar')}
            onFechar={fechar}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}
