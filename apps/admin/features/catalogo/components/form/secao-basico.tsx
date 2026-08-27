'use client'

import { AlignLeft, Clock, FolderTree, Ruler, Tag, X } from 'lucide-react'

import { Card, CardContent } from '@repo/ui/components/card'
import { Input } from '@repo/ui/components/input'
import { Label } from '@repo/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'
import { Textarea } from '@repo/ui/components/textarea'

import type { CategoriaProdutoOption, CriarProdutoInput } from '../../lib/types'
import { SecaoPrecificacao } from './secao-precificacao'
import { SelectableCard } from '@repo/ui/components/selectable-card'
import { ResumoTamanhosPadrao, tamanhosPadrao } from './tamanhos-editor'
import { UploadMidia } from './upload-midia'

const SEM_CATEGORIA = '__nenhuma__'

export function SecaoBasico({
  dados,
  onChange,
  categoriasIniciais,
}: {
  dados: CriarProdutoInput
  onChange: (parcial: Partial<CriarProdutoInput>) => void
  categoriasIniciais: CategoriaProdutoOption[]
}) {
  return (
    <Card className="border-0">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <Tag className="size-3.5 text-muted-foreground" />
              Nome do produto
            </Label>
            <Input
              value={dados.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              placeholder="Ex: Marmita de feijoada"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <FolderTree className="size-3.5 text-muted-foreground" />
              Categoria
            </Label>
            <Select
              value={dados.categoriaId ?? SEM_CATEGORIA}
              onValueChange={(v) =>
                onChange({ categoriaId: v === SEM_CATEGORIA ? null : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_CATEGORIA}>Sem categoria</SelectItem>
                {categoriasIniciais.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-sm">
            <AlignLeft className="size-3.5 text-muted-foreground" />
            Descrição
          </Label>
          <Textarea
            value={dados.descricao}
            onChange={(e) => onChange({ descricao: e.target.value })}
            rows={3}
            placeholder="O que vem no prato/lanche..."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UploadMidia
            tipo="foto"
            label="Foto"
            value={dados.fotoUrl}
            onChange={(fotoUrl) => onChange({ fotoUrl })}
          />
          <UploadMidia
            tipo="video"
            label="Vídeo"
            value={dados.videoUrl}
            onChange={(videoUrl) => onChange({ videoUrl })}
          />
        </div>

        <div className="flex flex-col gap-1.5 pt-2 sm:w-1/2 sm:pr-2">
          <Label className="flex items-center gap-1.5 text-sm">
            <Clock className="size-3.5 text-muted-foreground" />
            Tempo médio de preparo (minutos)
          </Label>
          <Input
            type="number"
            min={0}
            value={dados.tempoMedioPreparoMinutos}
            onChange={(e) =>
              onChange({ tempoMedioPreparoMinutos: Number(e.target.value) })
            }
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Label className="text-sm">
            Este produto tem tamanhos? (ex: marmita P/M/G)
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectableCard
              icon={Ruler}
              label="Sim"
              selected={dados.temTamanhos}
              onClick={() =>
                onChange({
                  temTamanhos: true,
                  // Só reseta se ainda não tinha nada — reclicar em "Sim"
                  // não pode apagar preço já digitado no resumo.
                  tamanhos:
                    dados.tamanhos.length > 0
                      ? dados.tamanhos
                      : tamanhosPadrao(),
                })
              }
            />
            <SelectableCard
              icon={X}
              label="Não"
              selected={!dados.temTamanhos}
              onClick={() => onChange({ temTamanhos: false, tamanhos: [] })}
            />
          </div>

          {dados.temTamanhos && <ResumoTamanhosPadrao />}
        </div>

        <SecaoPrecificacao dados={dados} onChange={onChange} />
      </CardContent>
    </Card>
  )
}
