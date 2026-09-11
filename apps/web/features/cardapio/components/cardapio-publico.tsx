'use client'

import { useEffect, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { formatDateBR } from '@/lib/formatters'
import { buscarCardapioSemanaAction } from '../lib/actions'
import { carregarEscolha, salvarEscolha } from '../lib/lembrar-escolha'
import { TURNO_LABEL, turnosDisponiveis } from '../lib/turno-helpers'
import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
  SemanaOption,
  TurnoRefeicao,
} from '../lib/types'
import { CardapioBanner } from './cardapio-banner'
import { ColaboradorPicker } from './colaborador-picker'
import { RespostaForm } from './resposta-form'

function Pilula({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full cursor-pointer rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors',
        ativo
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-foreground hover:bg-accent'
      )}
    >
      {children}
    </button>
  )
}

export function CardapioPublico({
  empresa,
  colaboradores,
  cardapioInicial,
  semanas,
}: {
  empresa: EmpresaCardapioInfo
  colaboradores: ColaboradorOption[]
  cardapioInicial: CardapioDiaPublico[]
  semanas: SemanaOption[]
}) {
  const [semana, setSemana] = useState<SemanaOption>(semanas[0]!)
  const [cardapio, setCardapio] = useState(cardapioInicial)
  const [carregandoCardapio, setCarregandoCardapio] = useState(false)
  const [turno, setTurno] = useState<TurnoRefeicao | null>(null)
  const [colaborador, setColaborador] = useState<ColaboradorOption | null>(
    null
  )

  const opcoesTurno = turnosDisponiveis(empresa.fluxoPedido)

  // Restaura turno/nome lembrados desse aparelho pra essa empresa — só
  // depois de montar (localStorage não existe no server) e só se o
  // colaborador salvo ainda estiver ativo na lista atual.
  useEffect(() => {
    const salvo = carregarEscolha(empresa.id)
    if (!salvo) return
    if (opcoesTurno.includes(salvo.turno)) setTurno(salvo.turno)
    const colaboradorSalvo = colaboradores.find(
      (c) => c.id === salvo.colaboradorId
    )
    if (colaboradorSalvo) setColaborador(colaboradorSalvo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (turno && colaborador) {
      salvarEscolha(empresa.id, { turno, colaboradorId: colaborador.id })
    }
  }, [empresa.id, turno, colaborador])

  const { execute: buscarCardapio } = useAction(buscarCardapioSemanaAction, {
    onSuccess: ({ data }) => setCardapio(data?.cardapio ?? []),
    onError: () =>
      toast.error('Não foi possível carregar o cardápio dessa semana'),
    onSettled: () => setCarregandoCardapio(false),
  })

  function trocarSemana(nova: SemanaOption) {
    if (nova.inicio === semana.inicio) return
    setSemana(nova)
    setCarregandoCardapio(true)
    buscarCardapio({
      empresaId: empresa.id,
      from: nova.inicio,
      to: nova.fim,
      cardapioQtdAlternativas: empresa.cardapioQtdAlternativas,
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col">
      <CardapioBanner />

      <div className="flex flex-col gap-5 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {empresa.nome}
          </h1>
          <p className="text-sm text-muted-foreground">
            Cardápio de {formatDateBR(semana.inicio)} a{' '}
            {formatDateBR(semana.fim)}
          </p>
        </div>

        {empresa.avisoCardapio && (
          <div className="rounded-lg border border-border bg-accent p-3 text-sm text-accent-foreground">
            {empresa.avisoCardapio}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Semana</Label>
          <div className="grid grid-cols-2 gap-2">
            {semanas.map((s) => (
              <Pilula
                key={s.inicio}
                ativo={s.inicio === semana.inicio}
                onClick={() => trocarSemana(s)}
              >
                {s.label}
              </Pilula>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Turno</Label>
          <div className="grid grid-cols-2 gap-2">
            {opcoesTurno.map((t) => (
              <Pilula key={t} ativo={turno === t} onClick={() => setTurno(t)}>
                {TURNO_LABEL[t]}
              </Pilula>
            ))}
          </div>
        </div>

        {turno && (
          <div className="flex flex-col gap-1.5">
            <Label>Seu nome</Label>
            {colaborador ? (
              <div className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                <span className="font-medium">{colaborador.nome}</span>
                <button
                  type="button"
                  className="cursor-pointer text-xs font-medium text-primary underline-offset-2 hover:underline"
                  onClick={() => setColaborador(null)}
                >
                  Trocar
                </button>
              </div>
            ) : (
              <ColaboradorPicker
                colaboradores={colaboradores}
                onSelecionar={setColaborador}
              />
            )}
          </div>
        )}

        {carregandoCardapio ? (
          <p className="text-sm text-muted-foreground">
            Carregando cardápio...
          </p>
        ) : cardapio.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            O cardápio dessa semana ainda não foi publicado — volte mais
            tarde.
          </p>
        ) : (
          turno &&
          colaborador && (
            <RespostaForm
              empresa={empresa}
              colaborador={colaborador}
              turno={turno}
              cardapio={cardapio}
            />
          )
        )}
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium text-muted-foreground">
      {children}
    </span>
  )
}
