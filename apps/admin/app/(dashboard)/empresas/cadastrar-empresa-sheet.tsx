"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@repo/ui/components/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form"
import { maskCep, maskCnpj, maskPhone, onlyDigits } from "@repo/ui/lib/masks"

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

const empresaFormSchema = z.object({
  cnpj: z
    .string()
    .min(1, "Informe o CNPJ")
    .refine((value) => onlyDigits(value).length === 14, "CNPJ inválido"),
  nome: z.string().min(1, "Informe o nome da empresa"),
  responsavelNome: z.string().optional(),
  emailContato: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  telefoneContato: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  status: z.enum(["ativo", "inativo"]),
})

type EmpresaFormValues = z.infer<typeof empresaFormSchema>

const defaultValues: EmpresaFormValues = {
  cnpj: "",
  nome: "",
  responsavelNome: "",
  emailContato: "",
  telefoneContato: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  status: "ativo",
}

interface BrasilApiCnpjResponse {
  razao_social?: string
  nome_fantasia?: string
}

interface ViaCepResponse {
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

export function CadastrarEmpresaSheet() {
  const [open, setOpen] = React.useState(false)
  const [isLookingUpCnpj, setIsLookingUpCnpj] = React.useState(false)
  const [isLookingUpCep, setIsLookingUpCep] = React.useState(false)

  const form = useForm<EmpresaFormValues>({
    resolver: zodResolver(empresaFormSchema),
    defaultValues,
  })

  const cnpjValue = form.watch("cnpj")
  const cepValue = form.watch("cep")

  React.useEffect(() => {
    const digits = onlyDigits(cnpjValue ?? "")
    if (digits.length !== 14) return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setIsLookingUpCnpj(true)
      try {
        const response = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${digits}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          toast.error("CNPJ não encontrado na Receita Federal")
          return
        }
        const data: BrasilApiCnpjResponse = await response.json()
        const nomeEncontrado = data.razao_social ?? data.nome_fantasia
        if (nomeEncontrado && !form.getValues("nome")) {
          form.setValue("nome", nomeEncontrado, { shouldValidate: true })
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Não foi possível consultar o CNPJ agora")
        }
      } finally {
        setIsLookingUpCnpj(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cnpjValue])

  React.useEffect(() => {
    const digits = onlyDigits(cepValue ?? "")
    if (digits.length !== 8) return

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setIsLookingUpCep(true)
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${digits}/json/`,
          { signal: controller.signal }
        )
        const data: ViaCepResponse = await response.json()
        if (data.erro) {
          toast.error("CEP não encontrado")
          return
        }
        if (data.logradouro) form.setValue("logradouro", data.logradouro)
        if (data.bairro) form.setValue("bairro", data.bairro)
        if (data.localidade) form.setValue("cidade", data.localidade)
        if (data.uf) form.setValue("uf", data.uf, { shouldValidate: true })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast.error("Não foi possível consultar o CEP agora")
        }
      } finally {
        setIsLookingUpCep(false)
      }
    }, 400)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue])

  function onSubmit(values: EmpresaFormValues) {
    // Sem integração com o banco ainda (DB/migrations pendentes) — simula o cadastro.
    console.log(values)
    toast.success("Empresa cadastrada com sucesso")
    form.reset(defaultValues)
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset(defaultValues)
      }}
    >
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Cadastrar empresa
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader>
          <SheetTitle>Cadastrar empresa</SheetTitle>
          <SheetDescription>
            Preencha os dados da empresa cliente. Só nome, CNPJ e status são
            obrigatórios.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id="cadastrar-empresa-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-6 py-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          onChange={(e) =>
                            field.onChange(maskCnpj(e.target.value))
                          }
                        />
                        {isLookingUpCnpj && (
                          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome da empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavelNome"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailContato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de contato</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contato@empresa.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefoneContato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone de contato</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(maskPhone(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-4 border-t pt-6">
              <div>
                <h3 className="text-sm font-medium">Endereço</h3>
                <p className="text-sm text-muted-foreground">
                  Informe o CEP para preencher o restante automaticamente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            {...field}
                            onChange={(e) =>
                              field.onChange(maskCep(e.target.value))
                            }
                          />
                          {isLookingUpCep && (
                            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="uf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UFS.map((uf) => (
                            <SelectItem key={uf} value={uf}>
                              {uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logradouro"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Logradouro</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, avenida..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Nº" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complemento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Sala, bloco..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>

        <SheetFooter className="border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form="cadastrar-empresa-form">
            Salvar empresa
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
