import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Must run BEFORE importing @repo/db (Neon reads DATABASE_URL at init time)
config({ path: resolve(__dirname, '../.env.local') })

const { db } = await import('../lib/db.js')
const {
  empresa,
  colaborador_pedido,
  pedido_dia_importado,
  transacao_financeira,
} = await import('@repo/db')

/**
 * Lançamento único do pacote de 30 dias da Alexandra (cliente pessoa física,
 * ver ARCHITECTURE.md §6.4) — 4 beneficiários, 6 dias de pedido (23 a 30/09,
 * pulando fim de semana), preço por linha (não pelo "Finalizar dia", que
 * assume preço uniforme por tamanho — aqui varia por prato). Script one-off,
 * não é reexecutável (roda os inserts uma vez só).
 */

type Pessoa = 'Alexandre' | 'Léo' | 'Arthur' | 'Alexandra'

interface LinhaPedido {
  pessoa: Pessoa
  tamanho: 'P' | 'M'
  preco: number
  observacao: string
}

interface DiaPedido {
  data: string
  prato: string
  linhas: LinhaPedido[]
}

const DIAS: DiaPedido[] = [
  {
    data: '2026-09-23',
    prato: 'Filé de frango grelhado',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 23, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 25, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 23, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 23, observacao: 'Com purê' },
    ],
  },
  {
    data: '2026-09-24',
    prato: 'Polpetone',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 25, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 28, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 25, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 25, observacao: 'Com purê' },
    ],
  },
  {
    data: '2026-09-25',
    prato: 'Contra-filé acebolado',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 45, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 47, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 45, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 45, observacao: 'Legumes, não sendo batata' },
    ],
  },
  {
    data: '2026-09-28',
    prato: 'Filé de frango à parmegiana',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 28, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 31, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 28, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 28, observacao: 'Legumes, não sendo batata' },
    ],
  },
  {
    data: '2026-09-29',
    prato: 'Strogonoff de carne',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 29, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 33, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 29, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 29, observacao: 'Legumes, não sendo batata' },
    ],
  },
  {
    data: '2026-09-30',
    prato: 'Filé de frango à milanesa',
    linhas: [
      { pessoa: 'Alexandre', tamanho: 'P', preco: 24, observacao: 'Substituir legumes por purê' },
      { pessoa: 'Léo', tamanho: 'M', preco: 26, observacao: 'Substituir legumes por purê + batata frita' },
      { pessoa: 'Arthur', tamanho: 'P', preco: 24, observacao: 'Legumes, não sendo abobrinha e batata' },
      { pessoa: 'Alexandra', tamanho: 'P', preco: 24, observacao: 'Arroz separado — Tam. P' },
    ],
  },
]

const DESCONTO = 0.1

async function main() {
  const totalBruto = DIAS.reduce(
    (soma, dia) => soma + dia.linhas.reduce((s, l) => s + l.preco, 0),
    0
  )
  const totalComDesconto = Math.round(totalBruto * (1 - DESCONTO) * 100) / 100

  console.log(`Total bruto: R$ ${totalBruto.toFixed(2)}`)
  console.log(`Total com 10% de desconto: R$ ${totalComDesconto.toFixed(2)}`)

  const [empresaCriada] = await db
    .insert(empresa)
    .values({
      nome: 'Alexandra (pacote 23-30/09)',
      tipo: 'pessoa_fisica',
      responsavel_nome: 'Alexandra',
      status: 'ativo',
    })
    .returning({ id: empresa.id })

  if (!empresaCriada) throw new Error('Falha ao criar empresa pessoa física')
  console.log(`Empresa criada: ${empresaCriada.id}`)

  const nomes: Pessoa[] = ['Alexandre', 'Léo', 'Arthur', 'Alexandra']
  const colaboradorIdPorNome = new Map<Pessoa, string>()

  for (const nome of nomes) {
    const [colaborador] = await db
      .insert(colaborador_pedido)
      .values({
        empresa_id: empresaCriada.id,
        nome,
        tipo: 'funcionario',
      })
      .returning({ id: colaborador_pedido.id })

    if (!colaborador) throw new Error(`Falha ao criar colaborador ${nome}`)
    colaboradorIdPorNome.set(nome, colaborador.id)
    console.log(`Colaborador criado: ${nome} (${colaborador.id})`)
  }

  for (const dia of DIAS) {
    for (const linha of dia.linhas) {
      const colaboradorId = colaboradorIdPorNome.get(linha.pessoa)
      if (!colaboradorId) throw new Error(`Colaborador não encontrado: ${linha.pessoa}`)

      await db.insert(pedido_dia_importado).values({
        colaborador_id: colaboradorId,
        data: dia.data,
        tipo: 'marmita',
        turno: 'almoco',
        tamanho: linha.tamanho,
        prato: dia.prato,
        preco: linha.preco.toFixed(2),
        observacao: linha.observacao,
      })
    }
    console.log(`Pedidos lançados para ${dia.data} — ${dia.prato}`)
  }

  const [transacao] = await db
    .insert(transacao_financeira)
    .values({
      tipo: 'receita',
      origem: 'marmita_b2b',
      valor: totalComDesconto.toFixed(2),
      data: '2026-09-23',
      descricao:
        'Pacote 30 dias — Alexandra (4 pessoas, 23 a 30/09) — 10% de desconto aplicado',
      origem_tipo: 'empresa',
      origem_id: empresaCriada.id,
    })
    .returning({ id: transacao_financeira.id })

  console.log(`Transação financeira criada: ${transacao?.id}`)
  console.log('✅ Pacote lançado com sucesso')
}

await main()
process.exit(0)
