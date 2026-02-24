import { Activity, Package, AlertTriangle, Users, HeartPulse, Layers, HelpCircle } from "lucide-react";
import { cookies } from "next/headers";

async function getEstoqueCentral(id_unidade: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sysfarma.token')?.value;

    const res = await fetch(`http://127.0.0.1:3333/api/estoque/${id_unidade}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error('Failed to fetch data');
    return await res.json();
  } catch (err) {
    console.error("Error fetching", err);
    return [];
  }
}

async function getUnidades() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sysfarma.token')?.value;

    const res = await fetch(`http://127.0.0.1:3333/api/unidades`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'default',
      next: { revalidate: 60 }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching unidades", err);
    return [];
  }
}

async function getRemessasRecentes() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sysfarma.token')?.value;

    const res = await fetch(`http://127.0.0.1:3333/api/solicitacoes/remessas-recentes`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'default',
      next: { revalidate: 30 }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching remessas", err);
    return [];
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('sysfarma.user')?.value;
  const user = userCookie ? JSON.parse(userCookie) : {};

  // Fetch real stock and unities data
  const [estoque, unidadesData, remessas] = await Promise.all([
    getEstoqueCentral(user.unidade?.id),
    getUnidades(),
    getRemessasRecentes()
  ]);

  const totaisUnidades = unidadesData.filter((u: any) => u.tipo !== 'CAF' && u.tipo !== 'TI').length;

  // Grouping stock logic from EstoqueTable
  const mapa = new Map<string, any>();
  estoque.forEach((item: any) => {
    const medId = item.lote.medicamento.id;
    if (!mapa.has(medId)) {
      mapa.set(medId, {
        medicamentoId: medId,
        estoqueMinimo: item.lote.medicamento.estoque_minimo,
        quantidadeTotal: 0,
      });
    }
    const grupo = mapa.get(medId)!;
    grupo.quantidadeTotal += item.quantidade;
  });
  const agrupado = Array.from(mapa.values());

  // Calculate metrics
  const volumeTotalUnidades = agrupado.reduce((acc, curr) => acc + curr.quantidadeTotal, 0);
  const lowStockCount = agrupado.filter(g => g.quantidadeTotal <= g.estoqueMinimo).length;
  const totalItems = agrupado.length;
  const lowStockRatio = totalItems > 0 ? lowStockCount / totalItems : 0;

  let supplyStatus = "Saudável";
  let supplyTrend = "Todos os itens no ideal";
  let supplyAlert = false;
  let supplyColor = "text-teal-600";

  if (totalItems > 0) {
    if (lowStockRatio >= 0.7) {
      supplyStatus = "Crítico";
      supplyTrend = "Risco de desabastecimento";
      supplyAlert = true;
      supplyColor = "text-red-600";
    } else if (lowStockRatio >= 0.15) {
      supplyStatus = "Em Alerta";
      supplyTrend = "Estoque baixo do mínimo";
      supplyAlert = true;
      supplyColor = "text-amber-500";
    } else if (lowStockCount > 0) {
      supplyStatus = "Atenção";
      supplyTrend = `${lowStockCount} item(s) com baixa`;
      supplyColor = "text-indigo-600";
    }
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visão Geral</h1>
        <p className="text-slate-500 mt-1">Acompanhe as métricas do Centro Administrativo (CAF)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Variedades em Estoque"
          value={agrupado.length.toString()}
          icon={<Layers className="w-6 h-6 text-indigo-500" />}
          trend={`${estoque.length} lotes físicos`}
        />
        <MetricCard
          title="Volume Físico (Un.)"
          value={volumeTotalUnidades.toLocaleString('pt-BR')}
          icon={<Package className="w-6 h-6 text-blue-600" />}
          trend="Total de unidades soltas"
        />
        <MetricCard
          title="Status de Abastecimento"
          value={supplyStatus}
          icon={<HeartPulse className={`w-6 h-6 ${supplyColor}`} />}
          trend={supplyTrend}
          alert={supplyAlert}
        />
        <MetricCard
          title="Total de Unidades"
          value={totaisUnidades.toString()}
          icon={<Users className="w-6 h-6 text-slate-600" />}
          trend="Hospitais / UBS atendidos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            Últimas Remessas Enviadas
          </h2>
          {remessas && remessas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Data / Hora</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Destino (UBS/Hospital)</th>
                    <th className="px-4 py-3 text-center">Volume</th>
                    <th className="px-4 py-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {remessas.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {new Date(log.data_evento).toLocaleDateString('pt-BR')} às {new Date(log.data_evento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${log.tipo_logistica === 'REMESSA_AVULSA'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-teal-100 text-teal-700 border border-teal-200'
                          }`}>
                          {log.tipo_logistica === 'REMESSA_AVULSA' ? 'Remessa Manual' : 'Pedido Atendido'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700">{log.destino}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">
                          {log.quantidade_itens} {log.quantidade_itens === 1 ? 'Item' : 'Itens'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {log.responsavel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              <Package className="w-12 h-12 mb-4 text-slate-300" />
              <p>Nenhuma remessa despachada recentemente.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Avisos do Sistema</h2>
          <ul className="space-y-4">
            {lowStockCount > 0 && (
              <li className="flex items-start space-x-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>Existem <strong>{lowStockCount} itens</strong> abaixo do estoque mínimo estabelecido na CAF.</p>
              </li>
            )}
            <li className="flex items-start space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Bem-vindo ao dashboard de gerenciamento farmacêutico SESA.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, alert }: { title: string, value: string, icon: any, trend: string, alert?: boolean }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-slate-50 rounded-lg">
          {icon}
        </div>
        {alert && <span className="flex w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-slate-900">{value}</p>
      </div>
      <div className={`mt-4 text-sm font-medium ${alert ? 'text-red-500' : 'text-slate-400'}`}>
        {trend}
      </div>
    </div>
  )
}
