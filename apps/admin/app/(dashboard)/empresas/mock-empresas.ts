export type EmpresaStatus = "aguardando" | "finalizado"

export interface EmpresaRow {
  id: string
  nome: string
  cnpj: string
  email: string
  responsavelNome: string
  responsavelTelefone: string
  cadastradaEm: string
  funcionariosRespondidos: number
  funcionariosTotal: number
  status: EmpresaStatus
}

export const mockEmpresas: EmpresaRow[] = [
  {
    id: "1",
    nome: "Construtora Vale Verde",
    cnpj: "12.345.678/0001-90",
    email: "contato@valeverde.com.br",
    responsavelNome: "Marcos Andrade",
    responsavelTelefone: "(11) 98765-4321",
    cadastradaEm: "2026-02-14",
    funcionariosRespondidos: 31,
    funcionariosTotal: 42,
    status: "finalizado",
  },
  {
    id: "2",
    nome: "Tech Solutions Ltda",
    cnpj: "23.456.789/0001-01",
    email: "financeiro@techsolutions.com.br",
    responsavelNome: "Beatriz Lima",
    responsavelTelefone: "(11) 91234-5678",
    cadastradaEm: "2026-03-02",
    funcionariosRespondidos: 9,
    funcionariosTotal: 18,
    status: "aguardando",
  },
  {
    id: "3",
    nome: "Logística Rápida S.A.",
    cnpj: "34.567.890/0001-12",
    email: "rh@logisticarapida.com.br",
    responsavelNome: "Carlos Eduardo Souza",
    responsavelTelefone: "(11) 99876-5432",
    cadastradaEm: "2026-03-19",
    funcionariosRespondidos: 40,
    funcionariosTotal: 65,
    status: "aguardando",
  },
  {
    id: "4",
    nome: "Distribuidora Nordeste",
    cnpj: "45.678.901/0001-23",
    email: "contato@distnordeste.com.br",
    responsavelNome: "Fernanda Costa",
    responsavelTelefone: "(11) 98123-4567",
    cadastradaEm: "2026-04-07",
    funcionariosRespondidos: 27,
    funcionariosTotal: 27,
    status: "finalizado",
  },
  {
    id: "5",
    nome: "Metalúrgica Ferro Bom",
    cnpj: "56.789.012/0001-34",
    email: "compras@ferrobom.com.br",
    responsavelNome: "Ricardo Nunes",
    responsavelTelefone: "(11) 97654-3210",
    cadastradaEm: "2026-05-11",
    funcionariosRespondidos: 51,
    funcionariosTotal: 51,
    status: "finalizado",
  },
  {
    id: "6",
    nome: "Escritório Contábil Prisma",
    cnpj: "67.890.123/0001-45",
    email: "atendimento@prismacontabil.com.br",
    responsavelNome: "Juliana Alves",
    responsavelTelefone: "(11) 96543-2109",
    cadastradaEm: "2026-06-23",
    funcionariosRespondidos: 3,
    funcionariosTotal: 9,
    status: "aguardando",
  },
  {
    id: "7",
    nome: "Auto Peças Central",
    cnpj: "78.901.234/0001-56",
    email: "vendas@autopecascentral.com.br",
    responsavelNome: "Paulo Henrique Dias",
    responsavelTelefone: "(11) 95432-1098",
    cadastradaEm: "2026-07-01",
    funcionariosRespondidos: 15,
    funcionariosTotal: 15,
    status: "finalizado",
  },
]
