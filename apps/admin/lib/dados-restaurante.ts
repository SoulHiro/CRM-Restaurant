/**
 * Fatos fixos do próprio restaurante — nome, endereço, CNPJ, I.E. Não mudam
 * (é literalmente o registro legal da empresa), então em vez de morar no
 * banco (buscar via action, esperar o fetch, torcer pro estado carregar a
 * tempo — a fonte de vários bugs de "não aparece na impressão" desta
 * sessão), viram constante embutida no bundle via `NEXT_PUBLIC_*`. Sempre
 * corretos, sem round-trip nenhum. Se mudar um dia, é editar o `.env` e
 * redeployar — não tem tela pra isso de propósito.
 */
export const NOME_RESTAURANTE = process.env.NEXT_PUBLIC_RESTAURANTE_NOME ?? ''
export const ENDERECO_RESTAURANTE =
  process.env.NEXT_PUBLIC_RESTAURANTE_ENDERECO ?? ''
export const CNPJ_RESTAURANTE = process.env.NEXT_PUBLIC_RESTAURANTE_CNPJ ?? ''
export const IE_RESTAURANTE = process.env.NEXT_PUBLIC_RESTAURANTE_IE ?? ''
