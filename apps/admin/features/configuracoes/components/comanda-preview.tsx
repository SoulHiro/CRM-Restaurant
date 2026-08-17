import { formatDateTimeBR } from '@/lib/formatters'
import { type CampoComandaKey } from '../lib/types'

const TURNO_LABEL = 'ALMOÇO'
const AGORA = new Date().toISOString()

const CAMPO_CONTEUDO: Record<CampoComandaKey, React.ReactNode> = {
  turno: (
    <div className="rounded border-2 border-zinc-900 py-1.5 text-center text-sm font-bold tracking-wide">
      {TURNO_LABEL}
    </div>
  ),
  prato: <p className="text-[13px] text-zinc-800">Frango grelhado com arroz</p>,
  tamanho: <p className="text-xs text-zinc-600">Tamanho: Média</p>,
  observacao: <p className="text-xs text-zinc-600">Obs: sem cebola</p>,
  empresa: (
    <p className="border-t border-dashed border-zinc-300 pt-1.5 text-[10px] text-zinc-500">
      Restaurante Nosso Quintal
    </p>
  ),
  respondido_em: (
    <p className="text-[10px] text-zinc-500">
      Respondido em {formatDateTimeBR(AGORA)}
    </p>
  ),
  impresso_em: (
    <p className="text-[10px] text-zinc-500">
      Impresso em {formatDateTimeBR(AGORA)}
    </p>
  ),
}

/**
 * Espelho em HTML do que o `ComandaPDF` real gera — sem PDF, sem iframe,
 * sem chrome de visualizador (zoom, busca, contador de página). O que
 * importa aqui é mostrar ordem e visibilidade dos campos instantaneamente;
 * o PDF exato só existe na hora de imprimir de verdade. Nome e empresa são
 * um exemplo fixo — "Restaurante Nosso Quintal" pra não parecer dado real.
 */
export function ComandaPreview({ campos }: { campos: CampoComandaKey[] }) {
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="w-full max-w-[260px] shrink-0 rounded-sm bg-white p-4 text-zinc-900 shadow-lg">
        <p className="mb-3 text-lg font-bold leading-tight">
          Ana Beatriz Ferreira
        </p>
        <div className="flex flex-col gap-2">
          {campos.map((campo) => (
            <div key={campo}>{CAMPO_CONTEUDO[campo]}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
