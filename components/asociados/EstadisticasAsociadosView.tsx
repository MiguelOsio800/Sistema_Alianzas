import React, { useMemo } from 'react';
import { Asociado, PagoAsociado } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../icons/Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';


interface EstadisticasAsociadosViewProps {
    asociados: Asociado[];
    pagos: PagoAsociado[];
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EstadisticasAsociadosView: React.FC<EstadisticasAsociadosViewProps> = ({ asociados, pagos }) => {
    
    const { solventes, deudores, totalDeuda } = useMemo(() => {
        const deudoresMap = new Map<string, { asociado: Asociado, deuda: number }>();
        
        pagos.forEach(pago => {
            if (pago.status === 'Pendiente') {
                if (!deudoresMap.has(pago.asociadoId)) {
                    const asociado = asociados.find(a => a.id === pago.asociadoId);
                    if (asociado) {
                        deudoresMap.set(pago.asociadoId, { asociado, deuda: 0 });
                    }
                }
                const deudor = deudoresMap.get(pago.asociadoId);
                if (deudor) {
                    deudor.deuda += pago.montoBs;
                }
            }
        });
        
        const deudoresList = Array.from(deudoresMap.values());
        const deudoresIds = new Set(deudoresList.map(d => d.asociado.id));

        const solventesList = asociados.filter(a => !deudoresIds.has(a.id));

        const totalDeudaGeneral = deudoresList.reduce((sum, d) => sum + d.deuda, 0);

        return {
            solventes: solventesList,
            deudores: deudoresList,
            totalDeuda: totalDeudaGeneral
        };
    }, [asociados, pagos]);
    
    const pieData = [
        { name: 'Solventes', value: solventes.length },
        { name: 'Con Deudas', value: deudores.length },
    ];
    const COLORS = ['#10B981', '#F59E0B'];

    return (
        <div className="space-y-6">
             <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'asociados'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver al Módulo de Asociados
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas de Pagos de Asociados</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 items-center">
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} asociado(s)`, 'Cantidad']} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="text-center md:text-left">
                        <p className="text-lg">Total General Adeudado:</p>
                        <p className="text-4xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDeuda)}</p>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            <CardTitle>Asociados Solventes ({solventes.length})</CardTitle>
                        </div>
                    </CardHeader>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {solventes.map(asociado => (
                            <li key={asociado.id} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md text-sm">
                                {asociado.nombre}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card>
                    <CardHeader>
                         <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                            <CardTitle>Asociados con Deudas ({deudores.length})</CardTitle>
                        </div>
                    </CardHeader>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {deudores.map(({ asociado, deuda }) => (
                            <li key={asociado.id} className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-sm flex justify-between">
                                <span>{asociado.nombre}</span>
                                <span className="font-semibold text-yellow-800 dark:text-yellow-200">{formatCurrency(deuda)}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default EstadisticasAsociadosView;