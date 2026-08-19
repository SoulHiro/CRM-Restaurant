import { formatCurrencyBRL, formatDateTimeSecondsBR } from '@/lib/formatters'
import type { CampoResumoKey } from '../lib/types'

const AGORA = new Date().toISOString()

const ITENS_EXEMPLO = [
  { prato: 'Frango grelhado', tamanho: 'G', nome: 'Maria Silva', preco: 22 },
  { prato: 'Carne de panela', tamanho: 'M', nome: 'João Souza', preco: 18 },
  { prato: 'Salada completa', tamanho: 'P', nome: 'Ana Costa', preco: 14 },
  { prato: 'Lanche misto quente', tamanho: null, nome: 'Pedro Lima', preco: 12 },
]

/**
 * Espelho em HTML do que `ResumoDiaPDF` gera — mesma ideia do
 * `ComandaPreview`, sem PDF/iframe. Nome, endereço, CNPJ e I.E. refletem o
 * que está sendo digitado ao lado, ao vivo, antes mesmo de salvar.
 */
export function ResumoDiaPreview({
  nomeEstabelecimento,
  endereco,
  cnpj,
  inscricaoEstadual,
  campos,
}: {
  nomeEstabelecimento: string
  endereco: string
  cnpj: string
  inscricaoEstadual: string
  campos: CampoResumoKey[]
}) {
  const totalItens = ITENS_EXEMPLO.reduce((soma, item) => soma + item.preco, 0)
  const totalCafe = 3 * 3
  const totalSuco = 2 * 5

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto p-6">
      <div className="w-full max-w-[260px] shrink-0 rounded-sm bg-white p-4 text-zinc-900 shadow-lg">
        <div className="mb-2.5 grid grid-cols-3 gap-1 rounded border-2 border-zinc-900 p-2 text-center">
          {[
            { label: 'P', valor: 1 },
            { label: 'M', valor: 1 },
            { label: 'G', valor: 1 },
            { label: 'Lanche', valor: 1 },
            { label: 'Café', valor: 3 },
            { label: 'Suco', valor: 2 },
          ].map((bloco) => (
            <div key={bloco.label}>
              <p className="text-[9px] font-bold">{bloco.label}</p>
              <p className="text-lg font-bold">{bloco.valor}</p>
            </div>
          ))}
        </div>

        {campos.map((campo) => {
          switch (campo) {
            case 'nome':
              return (
                <p
                  key={campo}
                  className="mt-2 text-base font-bold leading-tight"
                >
                  {nomeEstabelecimento || 'Restaurante Nosso Quintal'}
                </p>
              )
            case 'endereco':
              return (
                endereco && (
                  <p key={campo} className="text-[10px] text-zinc-600">
                    {endereco}
                  </p>
                )
              )
            case 'cnpj_ie':
              return (
                (cnpj || inscricaoEstadual) && (
                  <div
                    key={campo}
                    className="flex justify-between text-[10px] text-zinc-600"
                  >
                    <span>{cnpj && `CNPJ: ${cnpj}`}</span>
                    <span>
                      {inscricaoEstadual && `I.E.: ${inscricaoEstadual}`}
                    </span>
                  </div>
                )
              )
            default:
              return null
          }
        })}

        <div className="mt-2 border-t border-zinc-900 pt-1.5">
          <p className="text-[10px] text-zinc-500">
            Impresso em {formatDateTimeSecondsBR(AGORA)}
          </p>
          <p className="mb-2.5 mt-0.5 text-sm font-bold">
            Empresa Cliente Exemplo
          </p>
        </div>

        {ITENS_EXEMPLO.map((item, indice) => (
          <div
            key={indice}
            className="mb-2 border-b border-dashed border-zinc-300 pb-1.5"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold">{item.prato}</span>
              <span className="text-[10px] font-bold">
                {formatCurrencyBRL(item.preco)}
              </span>
            </div>
            {item.tamanho && (
              <p className="text-[10px] text-zinc-600">
                Tamanho: {item.tamanho}
              </p>
            )}
            <p className="text-[10px]">{item.nome}</p>
          </div>
        ))}

        <div className="flex justify-between text-[10px]">
          <span>Café (3x)</span>
          <span>{formatCurrencyBRL(totalCafe)}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Suco (2x)</span>
          <span>{formatCurrencyBRL(totalSuco)}</span>
        </div>

        <div className="mt-2 flex justify-between border-t border-zinc-900 pt-2 text-[10px] font-bold">
          <span>Total a pagar</span>
          <span>{formatCurrencyBRL(totalItens + totalCafe + totalSuco)}</span>
        </div>
      </div>
    </div>
  )
}
