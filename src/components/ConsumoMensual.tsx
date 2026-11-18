export type ConsumoMensualRow = {
  mes: string;
  diesel: number;
  bencina: number;
};

const formatoLitros = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function nombreMes(mes: string) {
  const fecha = new Date(`${mes}-01T00:00:00.000Z`);
  const nombre = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

export default function ConsumoMensual({
  consumos,
}: {
  consumos: ConsumoMensualRow[];
}) {
  const totalDiesel = consumos.reduce((total, row) => total + row.diesel, 0);
  const totalBencina = consumos.reduce((total, row) => total + row.bencina, 0);

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium mb-2">Consumo mensual</h2>
      <p className="text-sm text-paper-ink-muted mb-4">
        Litros registrados por mes y tipo de combustible.
      </p>
      <div className="border border-paper-line rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-paper-line bg-paper-surface text-left text-paper-ink-muted">
              <th className="px-3 py-2 font-medium">Mes</th>
              <th className="px-3 py-2 font-medium text-right">Diésel (L)</th>
              <th className="px-3 py-2 font-medium text-right">Bencina (L)</th>
              <th className="px-3 py-2 font-medium text-right">Total (L)</th>
            </tr>
          </thead>
          <tbody>
            {consumos.map((row) => (
              <tr
                key={row.mes}
                className="border-b border-paper-line last:border-0"
              >
                <td className="px-3 py-2">{nombreMes(row.mes)}</td>
                <td className="px-3 py-2 text-right tabular">
                  {formatoLitros.format(row.diesel)}
                </td>
                <td className="px-3 py-2 text-right tabular">
                  {formatoLitros.format(row.bencina)}
                </td>
                <td className="px-3 py-2 text-right tabular font-medium">
                  {formatoLitros.format(row.diesel + row.bencina)}
                </td>
              </tr>
            ))}
            {consumos.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-paper-ink-muted"
                >
                  Aún no hay cargas registradas.
                </td>
              </tr>
            )}
          </tbody>
          {consumos.length > 0 && (
            <tfoot>
              <tr className="bg-paper-surface font-medium">
                <th className="px-3 py-2 text-left">Total acumulado</th>
                <td className="px-3 py-2 text-right tabular">
                  {formatoLitros.format(totalDiesel)}
                </td>
                <td className="px-3 py-2 text-right tabular">
                  {formatoLitros.format(totalBencina)}
                </td>
                <td className="px-3 py-2 text-right tabular">
                  {formatoLitros.format(totalDiesel + totalBencina)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
