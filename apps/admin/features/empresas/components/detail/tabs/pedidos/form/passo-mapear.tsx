'use client'

import { useMemo, useState } from 'react'

import { Checkbox } from '@repo/ui/components/checkbox'
import { DrawerFooter } from '@repo/ui/components/drawer'
import { Button } from '@repo/ui/components/button'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import {
  DIA_SEMANA_LABEL,
  DIAS_UTEIS,
  detectarColunas,
  parseSemanaCardapio,
} from '../../../../../lib/importacao-helpers'
import { hojeISO } from '@/lib/formatters'
import type {
  LinhaBruta,
  MapeamentoColunas,
  PlanilhaLida,
} from './importar-planilha-types'

const NENHUMA = '__nenhuma__'

function ColunaSelect({
  label,
  cabecalho,
  valor,
  onChange,
}: {
  label: string
  cabecalho: LinhaBruta
  valor: number | null
  onChange: (indice: number | null) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={valor == null ? NENHUMA : String(valor)}
        onValueChange={(v) => onChange(v === NENHUMA ? null : Number(v))}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NENHUMA}>— nenhuma —</SelectItem>
          {cabecalho.map((coluna, indice) => (
            <SelectItem key={indice} value={String(indice)}>
              {String(coluna || `Coluna ${indice + 1}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PassoMapear({
  planilha,
  onConfirmar,
  onVoltar,
}: {
  planilha: PlanilhaLida
  onConfirmar: (
    mapeamento: MapeamentoColunas,
    semanasSelecionadas: Set<string>
  ) => void
  onVoltar: () => void
}) {
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>(() =>
    detectarColunas(planilha.cabecalho)
  )

  const semanasEncontradas = useMemo(() => {
    if (mapeamento.colSemana == null) return []
    const set = new Set<string>()
    for (const linha of planilha.linhas) {
      const texto = String(linha[mapeamento.colSemana] ?? '').trim()
      if (texto) set.add(texto)
    }
    return Array.from(set).sort((a, b) => {
      const ia = parseSemanaCardapio(a)?.inicio ?? ''
      const ib = parseSemanaCardapio(b)?.inicio ?? ''
      return ib.localeCompare(ia)
    })
  }, [mapeamento.colSemana, planilha.linhas])

  const hoje = hojeISO()
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<Set<string>>(
    () =>
      new Set(
        semanasEncontradas.filter((texto) => {
          const inicio = parseSemanaCardapio(texto)?.inicio
          if (!inicio) return false
          const diff = Math.abs(
            (new Date(inicio).getTime() - new Date(hoje).getTime()) /
              86_400_000
          )
          return diff <= 7
        })
      )
  )

  function setColuna(
    campo: keyof Omit<MapeamentoColunas, 'dias'>,
    indice: number | null
  ) {
    setMapeamento((atual) => ({ ...atual, [campo]: indice }))
  }

  function setColunaDia(
    dia: (typeof DIAS_UTEIS)[number],
    campo: 'colPrato' | 'colObs',
    indice: number | null
  ) {
    setMapeamento((atual) => ({
      ...atual,
      dias: atual.dias.map((d) => (d.dia === dia ? { ...d, [campo]: indice } : d)),
    }))
  }

  function toggleSemana(texto: string) {
    setSemanasSelecionadas((atual) => {
      const novo = new Set(atual)
      if (novo.has(texto)) novo.delete(texto)
      else novo.add(texto)
      return novo
    })
  }

  const podeAvancar =
    mapeamento.colNome != null &&
    mapeamento.colSemana != null &&
    semanasSelecionadas.size > 0

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          <ColunaSelect
            label="Nome do colaborador"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colNome}
            onChange={(i) => setColuna('colNome', i)}
          />
          <ColunaSelect
            label="Semana do cardápio"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colSemana}
            onChange={(i) => setColuna('colSemana', i)}
          />
          <ColunaSelect
            label="Carimbo de data/hora"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colCarimbo}
            onChange={(i) => setColuna('colCarimbo', i)}
          />
          <ColunaSelect
            label="Turno"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colTurno}
            onChange={(i) => setColuna('colTurno', i)}
          />
          <ColunaSelect
            label="Tamanho da marmita"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colTamanho}
            onChange={(i) => setColuna('colTamanho', i)}
          />
          <ColunaSelect
            label="Whatsapp"
            cabecalho={planilha.cabecalho}
            valor={mapeamento.colWhatsapp}
            onChange={(i) => setColuna('colWhatsapp', i)}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Label className="text-sm">Colunas de cada dia</Label>
          {mapeamento.dias.map((dia) => (
            <div key={dia.dia} className="grid grid-cols-2 gap-4">
              <ColunaSelect
                label={`${DIA_SEMANA_LABEL[dia.dia]} — prato`}
                cabecalho={planilha.cabecalho}
                valor={dia.colPrato}
                onChange={(i) => setColunaDia(dia.dia, 'colPrato', i)}
              />
              <ColunaSelect
                label={`${DIA_SEMANA_LABEL[dia.dia]} — observações`}
                cabecalho={planilha.cabecalho}
                valor={dia.colObs}
                onChange={(i) => setColunaDia(dia.dia, 'colObs', i)}
              />
            </div>
          ))}
        </div>

        {mapeamento.colSemana != null && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm">
              Semanas encontradas — marque quais importar
            </Label>
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              {semanasEncontradas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma semana reconhecida nessa coluna.
                </p>
              ) : (
                semanasEncontradas.map((texto) => (
                  <label
                    key={texto}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={semanasSelecionadas.has(texto)}
                      onCheckedChange={() => toggleSemana(texto)}
                    />
                    {texto}
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <DrawerFooter className="flex-row justify-end gap-2 border-t">
        <Button variant="outline" onClick={onVoltar}>
          Voltar
        </Button>
        <Button
          disabled={!podeAvancar}
          onClick={() => onConfirmar(mapeamento, semanasSelecionadas)}
        >
          Continuar
        </Button>
      </DrawerFooter>
    </>
  )
}
