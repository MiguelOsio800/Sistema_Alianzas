import React, { useState, useMemo } from 'react';
import { Asociado, PagoAsociado, ReciboPagoAsociado, CompanyInfo } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, ReceiptIcon } from '../icons/Icons';
import PagoAsociadoFormModal from './PagoAsociadoFormModal';
import RegistrarPagoModal from './RegistrarPagoModal';

interface PagosAsociadoTabProps {
    asociado: Asociado;
    pagos: PagoAsociado[];
    onSavePago: (pago: PagoAsociado) => void;
    onDeletePago: (pagoId: string) => void;
    recibos: ReciboPagoAsociado[];
    onSaveRecibo: (recibo: ReciboPagoAsociado) => void;
    companyInfo: CompanyInfo;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PagosAsociadoTab: React.FC<PagosAsociadoTabProps> = (props) => {
    const { asociado, pagos, onSavePago, recibos, onSaveRecibo, companyInfo } = props;

    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [editingPago, setEditingPago] = useState<PagoAsociado | null>(null);

    const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);

    const { pagosPendientes, pagosRealizados, recibosAsociado, totalDeuda } = useMemo(() => {
        const misPagos = pagos.filter(p => p.asociadoId === asociado.id);
        const pendientes = misPagos.filter(p => p.status === 'Pendiente');
        const realizados = misPagos.filter(p => p.status === 'Pagado');
        const misRecibos = recibos.filter(r => r.asociadoId === asociado.id);
        const deuda = pendientes.reduce((sum, p) => sum + p.montoBs, 0);
        return { 
            pagosPendientes: pendientes, 
            pagosRealizados: realizados, 
            recibosAsociado: misRecibos,
            totalDeuda: deuda,
        };
    }, [pagos, recibos, asociado.id]);

    const handleOpenPagoModal = (pago: PagoAsociado | null) => {
        setEditingPago(pago);
        setIsPagoModalOpen(true);
    };

    const handleSavePago = (pago: PagoAsociado) => {
        onSavePago(pago);
        setIsPagoModalOpen(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cuentas Pendientes y Acciones */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Cuentas Pendientes</CardTitle>
                        <div className="space-x-2">
                             <Button onClick={() => handleOpenPagoModal(null)} size="sm" variant="secondary">
                                <PlusIcon className="w-4 h-4 mr-1"/> Nueva Deuda
                            </Button>
                            <Button onClick={() => setIsReciboModalOpen(true)} size="sm" disabled={pagosPendientes.length === 0}>
                                <ReceiptIcon className="w-4 h-4 mr-1"/> Registrar Pago
                            </Button>
                        </div>
                    </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Saldo Deudor: <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalDeuda)}</span>
                    </p>
                </CardHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {pagosPendientes.length > 0 ? pagosPendientes.map(p => (
                        <div key={p.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">{p.concepto}</p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">Cuotas: {p.cuotas} | Vence: {p.fechaVencimiento}</p>
                                </div>
                                <p className="font-bold text-yellow-900 dark:text-yellow-100 text-right">
                                    {formatCurrency(p.montoBs)}
                                    {p.montoUsd && <span className="block text-xs font-normal text-yellow-800/80 dark:text-yellow-200/80">(${p.montoUsd.toFixed(2)})</span>}
                                </p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center py-8 text-gray-500 dark:text-gray-400">El asociado está solvente.</p>
                    )}
                </div>
            </Card>

             {/* Historial de Recibos */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Recibos de Pago</CardTitle>
                </CardHeader>
                 <div className="space-y-3 max-h-[29rem] overflow-y-auto pr-2">
                    {recibosAsociado.length > 0 ? recibosAsociado.map(r => (
                        <div key={r.id} className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md">
                            <div className="flex justify-between items-center font-semibold">
                                <p>Recibo N°: {r.comprobanteNumero}</p>
                                <p className="text-green-600 dark:text-green-400">{formatCurrency(r.montoTotalBs)}</p>
                            </div>
                             <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Pago: {r.fechaPago}</p>
                             <details className="text-xs mt-2">
                                <summary className="cursor-pointer">Ver detalles...</summary>
                                <ul className="list-disc pl-5 mt-1 text-gray-600 dark:text-gray-300">
                                     {r.detallesPago.map((dp, i) => (
                                        <li key={i}>{dp.tipo} {dp.banco && `- ${dp.banco}`} {dp.referencia && `(Ref: ${dp.referencia})`}: {formatCurrency(dp.monto)}</li>
                                    ))}
                                </ul>
                            </details>
                        </div>
                    )) : (
                         <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay recibos de pago registrados.</p>
                    )}
                </div>
            </Card>

            {isPagoModalOpen && (
                <PagoAsociadoFormModal
                    isOpen={isPagoModalOpen}
                    onClose={() => setIsPagoModalOpen(false)}
                    onSave={handleSavePago}
                    pago={editingPago}
                    asociadoId={asociado.id}
                    companyInfo={companyInfo}
                />
            )}
            
            {isReciboModalOpen && (
                 <RegistrarPagoModal
                    isOpen={isReciboModalOpen}
                    onClose={() => setIsReciboModalOpen(false)}
                    asociado={asociado}
                    pagosPendientes={pagosPendientes}
                    onSaveRecibo={onSaveRecibo}
                    companyInfo={companyInfo}
                />
            )}

        </div>
    );
};

export default PagosAsociadoTab;