'use client'

import { useState } from 'react'

import type {
  CardapioDiaPublico,
  ColaboradorOption,
  EmpresaCardapioInfo,
} from '../lib/types'
import { ColaboradorPicker } from './colaborador-picker'
import { RespostaForm } from './resposta-form'

export function CardapioPublico({
  empresa,
  colaboradores,
  cardapio,
}: {
  empresa: EmpresaCardapioInfo
  colaboradores: ColaboradorOption[]
  cardapio: CardapioDiaPublico[]
}) {
  const [colaborador, setColaborador] = useState<ColaboradorOption | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-xl font-semibold">{empresa.nome}</h1>
        <p className="text-sm text-muted-foreground">
          Escolha seu prato da semana. Já respondeu? Escolha seu nome de novo
          pra ver e mudar o que já marcou.
        </p>
      </div>

      {cardapio.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          O cardápio dessa semana ainda não foi publicado — volte mais tarde.
        </p>
      ) : (
        <>
          <ColaboradorPicker
            colaboradores={colaboradores}
            onSelecionar={setColaborador}
          />

          {colaborador && (
            <RespostaForm
              empresa={empresa}
              colaborador={colaborador}
              cardapio={cardapio}
            />
          )}
        </>
      )}
    </div>
  )
}
