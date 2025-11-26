import React, { useState, useMemo } from 'react';
import { Asociado, PagoAsociado, ReciboPagoAsociado, CompanyInfo, Permissions, Invoice } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, ReceiptIcon, ArrowLeftIcon, UserIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon, EyeIcon, TrashIcon } from '../icons/Icons';
import PagoAsociadoFormModal from './PagoAsociadoFormModal';
import RegistrarPagoModal from './RegistrarPagoModal';
import Select from '../ui/Select';
import GenerarDeudaProduccionModal from './GenerarDeudaProduccionModal';
import ReciboPagoAsociadoModal from './ReciboPagoAsociadoModal';
import { useData } from '../../contexts/DataContext';

interface AsociadosPagosViewProps {
    asociados: Asociado[];
    pagos: PagoAsociado[];
    recibos: ReciboPagoAsociado[];
    onSavePago: (pago: PagoAsociado) => Promise<void>;
    onDeletePago: (pagoId: string) => Promise<void>;
    onSaveRecibo: (recibo: ReciboPagoAsociado) => Promise<void>;
    companyInfo: CompanyInfo;
    permissions: Permissions;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isOverdue = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const dueDate = new Date(dateString + 'T00:00:00');
    return dueDate < today;
};

const AsociadosPagosView: React.FC<AsociadosPagosViewProps> = (props) => {
    const { asociados, pagos, recibos, onSavePago, onDeletePago, onSaveRecibo, companyInfo, permissions } = props;
    const { invoices } = useData(); // Get invoices for debt calculation

    const [selectedAsociadoId, setSelectedAsociadoId] = useState<string>('');
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
    const [editingPago, setEditingPago] = useState<PagoAsociado | null>(null);
    const [isReciboModalOpen, setIsReciboModalOpen] = useState(false);
    const [isDeudaProduccionModalOpen, setIsDeudaProduccionModalOpen] = useState(false);
    
    const [viewReciboModalOpen, setViewReciboModalOpen] = useState(false);
    const [selectedRecibo, setSelectedRecibo] = useState<ReciboPagoAsociado | null>(null);
    
    const selectedAsociado = useMemo(() => {
        return asociados.find(a => a.id === selectedAsociadoId);
    }, [asociados, selectedAsociadoId]);

    const { pagosPendientes, recibosAsociado, totalDeuda } = useMemo(() => {
        if (!selectedAsociadoId) {
            return { pagosPendientes: [], recibosAsociado: [], totalDeuda: 0 };
        }
        const misPagos = pagos.filter(p => p.asociadoId === selectedAsociadoId);
        const pendientes = misPagos.filter(p => p.status === 'Pendiente').sort((a,b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
        const misRecibos = recibos.filter(r => r.asociadoId === selectedAsociadoId).sort((a,b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());
        const deuda = pendientes.reduce((sum, p) => sum + p.montoBs, 0);
        return { 
            pagosPendientes: pendientes, 
            recibosAsociado: misRecibos,
            totalDeuda: deuda,
        };
    }, [pagos, recibos, selectedAsociadoId]);

    const handleOpenPagoModal = (pago: PagoAsociado | null) => {
        setEditingPago(pago);
        setIsPagoModalOpen(true);
    };

    const handleSavePago = async (pago: PagoAsociado) => {
        await onSavePago(pago);
        setIsPagoModalOpen(false);
    };

    const handleViewRecibo = (recibo: ReciboPagoAsociado) => {
        setSelectedRecibo(recibo);
        setViewReciboModalOpen(true);
    };

    const associateInvoices = useMemo(() => {
        if (!selectedAsociado) return [];
        // This is a simplified link. A real-world scenario might need a more robust link
        // between invoices and associates, maybe through the vehicle.
        // For now, let's assume invoices where the sender is the associate are theirs.
        return invoices.filter(inv => inv.clientIdNumber === selectedAsociado.cedula && inv.status === 'Activa');
    }, [invoices, selectedAsociado]);

    return (
        <div className="space-y-4">
            <Button variant="secondary" onClick={() => window.location.hash = 'asociados'}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Volver al Módulo de Asociados
            </Button>
            
            <Card>
                <CardHeader>
                    <CardTitle>Seleccionar Asociado</CardTitle>
                    <div className="max-w-md mt-2">
                        <Select label="" value={selectedAsociadoId} onChange={e => setSelectedAsociadoId(e.target.value)}>
                            <option value="">-- Busque y seleccione un asociado --</option>
                            {asociados.map(a => <option key={a.id} value={a.id}>{a.nombre} - {a.codigo}</option>)}
                        </Select>
                    </div>
                </CardHeader>

                {!selectedAsociado ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Seleccione un asociado</h3>
                        <p className="mt-1 text-sm text-gray-500">Elija un asociado de la lista para ver y gestionar sus pagos.</p>
                    </div>
                ) : (
                    <>
                    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">{selectedAsociado.nombre}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Código: {selectedAsociado.codigo} | C.I: {selectedAsociado.cedula}</p>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Saldo Deudor Total</p>
                                <p className={`text-3xl font-bold ${totalDeuda > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {formatCurrency(totalDeuda)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-primary-500" />
                                <CardTitle>Generación de Deudas por Producción</CardTitle>
                            </div>
                        </CardHeader>
                        <div className="flex justify-center p-4">
                             <Button onClick={() => setIsDeudaProduccionModalOpen(true)}>
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Generar Deuda por Producción
                            </Button>
                        </div>
                    </Card>


                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
                            </CardHeader>
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {pagosPendientes.length > 0 ? pagosPendientes.map(p => {
                                    const overdue = isOverdue(p.fechaVencimiento);
                                    return (
                                        <div key={p.id} className={`p-3 rounded-md border-l-4 flex justify-between items-center ${overdue ? 'bg-red-50 dark:bg-red-900/30 border-red-500' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500'}`}>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-semibold ${overdue ? 'text-red-800 dark:text-red-200' : 'text-yellow-800 dark:text-yellow-200'}`}>{p.concepto}</p>
                                                        <p className={`text-xs ${overdue ? 'text-red-700 dark:text-red-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                                                            {overdue && <ExclamationTriangleIcon className="w-3 h-3 inline-block mr-1" />}
                                                            Vence: {p.fechaVencimiento}
                                                        </p>
                                                    </div>
                                                    <p className={`font-bold text-right ${overdue ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                                                        {formatCurrency(p.montoBs)}
                                                        {p.montoUsd && <span className={`block text-xs font-normal ${overdue ? 'text-red-800/80 dark:text-red-200/80' : 'text-yellow-800/80 dark:text-yellow-200/80'}`}>(${p.montoUsd.toFixed(2)})</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            {permissions['asociados.pagos.delete'] && (
                                                <Button 
                                                    variant="danger" 
                                                    size="sm" 
                                                    className="ml-4 !p-2 flex-shrink-0"
                                                    onClick={async () => {
                                                        if (window.confirm(`¿Está seguro de que desea eliminar la deuda por "${p.concepto}"? Esta acción no se puede deshacer.`)) {
                                                            await onDeletePago(p.id);
                                                        }
                                                    }}
                                                    title="Eliminar Deuda"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )
                                }) : (
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
                                    <div key={r.id} className="p-3 bg-gray-100 dark:bg-gray-800/50 rounded-md block">
                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <p className="font-semibold">Recibo N°: {r.comprobanteNumero}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Fecha: {r.fechaPago}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(r.montoTotalBs)}</p>
                                                <Button size="sm" variant="secondary" onClick={() => handleViewRecibo(r)} className="mt-1">
                                                    <EyeIcon className="w-3 h-3 mr-1" /> Ver
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay recibos de pago registrados.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                    </>
                )}
            </Card>

            {isPagoModalOpen && selectedAsociado && (
                <PagoAsociadoFormModal
                    isOpen={isPagoModalOpen}
                    onClose={() => setIsPagoModalOpen(false)}
                    onSave={handleSavePago}
                    pago={editingPago}
                    asociadoId={selectedAsociado.id}
                    companyInfo={companyInfo}
                />
            )}
            
            {isReciboModalOpen && selectedAsociado && (
                <RegistrarPagoModal
                    isOpen={isReciboModalOpen}
                    onClose={() => setIsReciboModalOpen(false)}
                    asociado={selectedAsociado}
                    pagosPendientes={pagosPendientes}
                    onSaveRecibo={onSaveRecibo}
                    companyInfo={companyInfo}
                />
            )}

            {isDeudaProduccionModalOpen && selectedAsociado && (
                <GenerarDeudaProduccionModal
                    isOpen={isDeudaProduccionModalOpen}
                    onClose={() => setIsDeudaProduccionModalOpen(false)}
                    onGenerate={onSavePago}
                    asociado={selectedAsociado}
                    invoices={associateInvoices}
                    companyInfo={companyInfo}
                />
            )}
            
            {viewReciboModalOpen && selectedRecibo && selectedAsociado && (
                <ReciboPagoAsociadoModal
                    isOpen={viewReciboModalOpen}
                    onClose={() => setViewReciboModalOpen(false)}
                    recibo={selectedRecibo}
                    asociado={selectedAsociado}
                    pagos={pagos}
                    companyInfo={companyInfo}
                />
            )}
        </div>
    );
};

export default AsociadosPagosView;