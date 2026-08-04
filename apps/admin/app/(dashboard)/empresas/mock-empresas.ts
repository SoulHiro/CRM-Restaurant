export type EmpresaStatus = "aguardando" | "finalizado"

export interface EmpresaRow {
  id: string
  nome: string
  cnpj: string
  cadastradaEm: string
  funcionarios: number
  status: EmpresaStatus
}

export const mockEmpresas: EmpresaRow[] = [
  {
    id: "1",
    nome: "Construtora Vale Verde",
    cnpj: "12.345.678/0001-90",
    cadastradaEm: "2026-02-14",
    funcionarios: 42,
    status: "finalizado",
  },
  {
    id: "2",
    nome: "Tech Solutions Ltda",
    cnpj: "23.456.789/0001-01",
    cadastradaEm: "2026-03-02",
    funcionarios: 18,
    status: "aguardando",
  },
  {
    id: "3",
    nome: "Logística Rápida S.A.",
    cnpj: "34.567.890/0001-12",
    cadastradaEm: "2026-03-19",
    funcionarios: 65,
    status: "aguardando",
  },
  {
    id: "4",
    nome: "Distribuidora Nordeste",
    cnpj: "45.678.901/0001-23",
    cadastradaEm: "2026-04-07",
    funcionarios: 27,
    status: "finalizado",
  },
  {
    id: "5",
    nome: "Metalúrgica Ferro Bom",
    cnpj: "56.789.012/0001-34",
    cadastradaEm: "2026-05-11",
    funcionarios: 51,
    status: "finalizado",
  },
  {
    id: "6",
    nome: "Escritório Contábil Prisma",
    cnpj: "67.890.123/0001-45",
    cadastradaEm: "2026-06-23",
    funcionarios: 9,
    status: "aguardando",
  },
  {
    id: "7",
    nome: "Auto Peças Central",
    cnpj: "78.901.234/0001-56",
    cadastradaEm: "2026-07-01",
    funcionarios: 15,
    status: "finalizado",
  },
]
