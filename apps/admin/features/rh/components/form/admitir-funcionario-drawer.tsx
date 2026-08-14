'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserPlus } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@repo/ui/components/button'
import { Checkbox } from '@repo/ui/components/checkbox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/ui/components/drawer'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/form'
import { Input } from '@repo/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select'

import { useDrawerDirection } from '@/hooks/use-drawer-direction'
import { admitirFuncionarioAction } from '../../lib/actions'
import { DIAS_DA_SEMANA } from '../../lib/ausencia-helpers'
import {
  admitirFuncionarioDefaultValues,
  admitirFuncionarioSchema,
  type AdmitirFuncionarioInput,
} from '../../lib/schemas'
import { MODELO_LABELS, TURNO_LABELS } from '../../lib/salario-helpers'
import {
  MODELOS_CONTRATUAIS,
  TURNOS_TRABALHO,
  type Cargo,
} from '../../lib/types'

const SEM_FOLGA_FIXA = 'nenhum'

export function AdmitirFuncionarioDrawer({
  cargos,
  hoje,
}: {
  cargos: Cargo[]
  hoje: string
}) {
  const [open, setOpen] = useState(false)
  const { direction, variant } = useDrawerDirection()

  const form = useForm<AdmitirFuncionarioInput>({
    resolver: zodResolver(admitirFuncionarioSchema),
    defaultValues: admitirFuncionarioDefaultValues(hoje),
  })

  useEffect(() => {
    if (!open) form.reset(admitirFuncionarioDefaultValues(hoje))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const admitir = useAction(admitirFuncionarioAction, {
    onSuccess: () => {
      toast.success('Funcionário admitido')
      setOpen(false)
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? 'Não foi possível admitir')
    },
  })

  const ehEntregador = form.watch('ehEntregador')
  const modelo = form.watch('modeloContratual')
  const precisaCnpj = modelo === 'PJ' || modelo === 'MEI'

  /**
   * Escolher o cargo já traz os valores dele como ponto de partida, e marca
   * como entregador quando o cargo é de diária — quem quiser outro valor ainda
   * edita o campo.
   */
  function aoEscolherCargo(cargoId: string) {
    form.setValue('cargoId', cargoId, { shouldValidate: true })

    const escolhido = cargos.find((cargo) => cargo.id === cargoId)
    if (!escolhido) return

    if (escolhido.valorDiariaPadrao != null) {
      form.setValue('ehEntregador', true)
      if (!form.getValues('valorDiaria')) {
        form.setValue('valorDiaria', escolhido.valorDiariaPadrao)
      }
    }

    if (!form.getValues('salarioInicial')) {
      form.setValue('salarioInicial', escolhido.salarioBase)
    }
  }

  return (
    <Drawer direction={direction} open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto" disabled={cargos.length === 0}>
          <UserPlus className="size-4" />
          Admitir
        </Button>
      </DrawerTrigger>
      <DrawerContent
        direction={direction}
        variant={variant}
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-y-auto sm:max-h-none sm:max-w-lg"
      >
        <DrawerHeader>
          <DrawerTitle>Admitir funcionário</DrawerTitle>
          <DrawerDescription>
            O salário já entra como a primeira vigência do histórico — todo
            reajuste depois vira uma linha nova, sem apagar a anterior.
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            id="admitir-form"
            onSubmit={form.handleSubmit((values) => admitir.execute(values))}
            className="flex flex-1 flex-col gap-6 px-4 py-6"
          >
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: João Silva"
                      autoFocus
                      className="h-11 sm:h-9"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cargoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select value={field.value} onValueChange={aoEscolherCargo}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue placeholder="Escolher cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cargos.map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
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
                name="dataAdmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admitido em</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-11 sm:h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="turno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turno</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TURNOS_TRABALHO.map((turno) => (
                          <SelectItem key={turno} value={turno}>
                            {TURNO_LABELS[turno]}
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
                name="modeloContratual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vínculo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MODELOS_CONTRATUAIS.map((valor) => (
                          <SelectItem key={valor} value={valor}>
                            {MODELO_LABELS[valor]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        className="h-11 tabular-nums sm:h-9"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Guardado criptografado. A tela só mostra os últimos
                      dígitos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {precisaCnpj && (
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0001-00"
                          inputMode="numeric"
                          className="h-11 tabular-nums sm:h-9"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex flex-col gap-4 border-t pt-6">
              <FormField
                control={form.control}
                name="ehEntregador"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-1">
                      <FormLabel className="cursor-pointer">
                        Recebe por diária (entregador)
                      </FormLabel>
                      <FormDescription>
                        Na folha entra como diárias do mês, não como salário
                        fixo.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {ehEntregador ? (
                <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="valorDiaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da diária (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="100"
                            className="h-11 tabular-nums sm:h-9"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxaEntregaPercentual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxa de entrega (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            inputMode="decimal"
                            className="h-11 tabular-nums sm:h-9"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormDescription>Opcional.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="folgaSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Folga fixa na semana</FormLabel>
                      <Select
                        value={
                          field.value == null ? SEM_FOLGA_FIXA : String(field.value)
                        }
                        onValueChange={(valor) =>
                          field.onChange(
                            valor === SEM_FOLGA_FIXA ? undefined : Number(valor)
                          )
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 sm:h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SEM_FOLGA_FIXA}>
                            Sem dia fixo
                          </SelectItem>
                          {DIAS_DA_SEMANA.map((dia, indice) => (
                            <SelectItem key={dia} value={String(indice)}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Descontada da folha todo mês, sem precisar registrar.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="salarioInicial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          className="h-11 tabular-nums sm:h-9"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Vale a partir da data de admissão.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </form>
        </Form>

        <DrawerFooter>
          <Button
            type="submit"
            form="admitir-form"
            className="w-full"
            disabled={admitir.isExecuting}
          >
            {admitir.isExecuting ? 'Admitindo...' : 'Admitir funcionário'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
