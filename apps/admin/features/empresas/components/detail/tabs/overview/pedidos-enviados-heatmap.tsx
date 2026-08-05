import { formatDateBR } from '@/lib/formatters'
import type { EnviosHeatmap } from '../../../../lib/overview-helpers'

const NIVEL_CLASSNAME: Record<number, string> = {
  0: 'bg-background',
  1: 'bg-sidebar/25',
  2: 'bg-sidebar/50',
  3: 'bg-sidebar/75',
  4: 'bg-sidebar',
}

export function PedidosEnviadosHeatmap({
  heatmap,
}: {
  heatmap: EnviosHeatmap
}) {
  const { semanas, diasSemanaLabels } = heatmap

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `2rem repeat(${semanas.length}, minmax(0, 1fr))`,
          gridTemplateRows: `1rem repeat(7, minmax(0, 1fr))`,
        }}
      >
        <div style={{ gridColumn: 1, gridRow: 1 }} />
        {semanas.map((semana, index) => (
          <span
            key={`mes-${semana.dias[0]?.data ?? index}`}
            className="text-[10px] text-muted-foreground"
            style={{ gridColumn: index + 2, gridRow: 1 }}
          >
            {semana.mesLabel}
          </span>
        ))}

        {diasSemanaLabels.map((label, index) => (
          <span
            key={label}
            className="self-center text-[10px] text-muted-foreground"
            style={{ gridColumn: 1, gridRow: index + 2 }}
          >
            {index % 2 === 1 ? label : ''}
          </span>
        ))}

        {semanas.map((semana, semanaIndex) =>
          semana.dias.map((dia, diaIndex) => (
            <div
              key={dia.data}
              title={`${dia.total} pedido${dia.total === 1 ? '' : 's'} em ${formatDateBR(dia.data)}`}
              className={`aspect-square rounded-sm ${NIVEL_CLASSNAME[dia.nivel]}`}
              style={{ gridColumn: semanaIndex + 2, gridRow: diaIndex + 2 }}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((nivel) => (
          <div
            key={nivel}
            className={`size-3 rounded-sm ${NIVEL_CLASSNAME[nivel]}`}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}
