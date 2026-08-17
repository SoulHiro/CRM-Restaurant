import { formatDateTimeBR } from '@/lib/formatters'

const AGORA = new Date().toISOString()

/**
 * Espelho em HTML do que `ResumoDiaPDF` gera — mesma ideia do
 * `ComandaPreview`, sem PDF/iframe. Nome e empresa são exemplo fixo; CNPJ e
 * nome do estabelecimento refletem o que está sendo digitado ao lado, ao
 * vivo, antes mesmo de salvar.
 */
export function ResumoDiaPreview({
  nomeEstabelecimento,
  cnpj,
}: {
  nomeEstabelecimento: string
  cnpj: string
}) {
  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="w-full max-w-[260px] shrink-0 rounded-sm bg-white p-4 text-zinc-900 shadow-lg">
        <p className="mb-0.5 text-base font-bold leading-tight">
          {nomeEstabelecimento || 'Restaurante Nosso Quintal'}
        </p>
        {cnpj && (
          <p className="text-[10px] text-zinc-500">CNPJ: {cnpj}</p>
        )}
        <p className="text-[10px] text-zinc-500">
          Impresso em {formatDateTimeBR(AGORA)}
        </p>

        <p className="mb-2.5 mt-2.5 border-t border-dashed border-zinc-300 pt-2 text-sm font-bold">
          Empresa Cliente Exemplo
        </p>

        <div className="mb-2.5 flex justify-between rounded border-2 border-zinc-900 p-2">
          <div className="text-center">
            <p className="text-xs font-bold">P</p>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold">M</p>
            <p className="text-2xl font-bold">8</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold">G</p>
            <p className="text-2xl font-bold">5</p>
          </div>
        </div>

        <div className="flex justify-between text-sm">
          <span>Café</span>
          <span>3</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Suco</span>
          <span>2</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Lanche</span>
          <span>4</span>
        </div>
      </div>
    </div>
  )
}
