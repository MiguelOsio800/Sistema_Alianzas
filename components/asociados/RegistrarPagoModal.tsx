import React, { useState, useEffect, useMemo } from 'react';
import { PagoAsociado, Asociado, ReciboPagoAsociado, CompanyInfo } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { PlusIcon, TrashIcon } from '../icons/Icons';

interface RegistrarPagoModalProps {
    isOpen: boolean;
    onClose: () => void;
    asociado: Asociado;
    pagosPendientes: PagoAsociado[];
    onSaveRecibo: (recibo: ReciboPagoAsociado) => void;
    companyInfo: CompanyInfo;
}

type DetallePago = {
    tipo: string;
    banco?: string;
    referencia?: string;
    monto: number;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const RegistrarPagoModal: React.FC<RegistrarPagoModalProps> = ({ isOpen, onClose, asociado, pagosPendientes, onSaveRecibo, companyInfo }) => {
    const [selectedPagoIds, setSelectedPagoIds] = useState<string[]>([]);
    const [detallesPago, setDetallesPago] = useState<DetallePago[]>([{ tipo: 'Transferencia', monto: 0 }]);
    const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);

    const totalAPagar = useMemo(() => {
        return pagosPendientes
            .filter(p => selectedPagoIds.includes(p.id))
            .reduce((sum, p) => sum + p.montoBs, 0);
    }, [pagosPendientes, selectedPagoIds]);

    const totalPagado = useMemo(() => {
        return detallesPago.reduce((sum, d) => sum + d.monto, 0);
    }, [detallesPago]);

    const diferencia = totalAPagar - totalPagado;

    useEffect(() => {
        if (isOpen) {
            // Pre-select all pending payments when modal opens
            setSelectedPagoIds(pagosPendientes.map(p => p.id));
        }
    }, [isOpen, pagosPendientes]);
    
    useEffect(() => {
        // When total to pay changes, update the first payment detail amount automatically
        if (detallesPago.length === 1) {
            setDetallesPago([{ ...detallesPago[0], monto: totalAPagar }]);
        }
    }, [totalAPagar]);

    const handleTogglePago = (pagoId: string) => {
        setSelectedPagoIds(prev =>
            prev.includes(pagoId) ? prev.filter(id => id !== pagoId) : [...prev, pagoId]
        );
    };

    const handleDetalleChange = (index: number, field: keyof DetallePago, value: string | number) => {
        const newDetalles = [...detallesPago];
        (newDetalles[index] as any)[field] = value;
        setDetallesPago(newDetalles);
    };
    
    const addDetalle = () => {
        setDetallesPago([...detallesPago, { tipo: 'Transferencia', monto: 0 }]);
    };
    
    const removeDetalle = (index: number) => {
        setDetallesPago(detallesPago.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (diferencia !== 0) {
            alert('El monto pagado debe ser igual al total a pagar.');
            return;
        }
        if (selectedPagoIds.length === 0) {
            alert('Debe seleccionar al menos un concepto a pagar.');
            return;
        }

        const recibo: Omit<ReciboPagoAsociado, 'id'> = {
            comprobanteNumero: `C-${Date.now().toString().slice(-8)}`,
            asociadoId: asociado.id,
            fechaPago: fechaPago,
            montoTotalBs: totalAPagar,
            tasaBcv: companyInfo.bcvRate || 0,
            pagosIds: selectedPagoIds,
            detallesPago: detallesPago,
        };
        onSaveRecibo(recibo as ReciboPagoAsociado);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Pago para ${asociado.nombre}`} size="2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conceptos a Pagar */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Conceptos a Pagar</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 border p-2 rounded-md">
                        {pagosPendientes.map(pago => (
                            <label key={pago.id} className="flex items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedPagoIds.includes(pago.id)}
                                    onChange={() => handleTogglePago(pago.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div className="ml-3 flex-grow flex justify-between text-sm">
                                    <span>{pago.concepto}</span>
                                    <span className="font-semibold">{formatCurrency(pago.montoBs)}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Detalles del Pago */}
                <div className="space-y-3">
                     <h3 className="font-semibold text-lg">Detalles del Pago</h3>
                     <Input label="Fecha de Pago" type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
                     <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                         {detallesPago.map((detalle, index) => (
                             <div key={index} className="p-3 border rounded-md relative space-y-2">
                                 {detallesPago.length > 1 && (
                                    <button onClick={() => removeDetalle(index)} className="absolute top-1 right-1 text-red-500 hover:text-red-700">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                 )}
                                <Select label="Forma de Pago" value={detalle.tipo} onChange={e => handleDetalleChange(index, 'tipo', e.target.value)}>
                                    <option>Transferencia</option>
                                    <option>Efectivo Bs.</option>
                                    <option>Efectivo Divisa</option>
                                    <option>Pago Móvil</option>
                                </Select>
                                <Input label="Banco" value={detalle.banco || ''} onChange={e => handleDetalleChange(index, 'banco', e.target.value)} />
                                <Input label="Referencia" value={detalle.referencia || ''} onChange={e => handleDetalleChange(index, 'referencia', e.target.value)} />
                                <Input label="Monto" type="number" step="0.01" value={detalle.monto} onChange={e => handleDetalleChange(index, 'monto', Number(e.target.value))} required />
                             </div>
                         ))}
                     </div>
                     <Button variant="secondary" size="sm" onClick={addDetalle} className="w-full">
                        <PlusIcon className="w-4 h-4 mr-1"/> Añadir otra forma de pago
                     </Button>
                </div>
            </div>

            {/* Totales y Submit */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700 space-y-2">
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total a Pagar:</span>
                    <span>{formatCurrency(totalAPagar)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                    <span>Total Pagado:</span>
                    <span>{formatCurrency(totalPagado)}</span>
                </div>
                <div className={`flex justify-between font-bold text-xl p-2 rounded-md ${diferencia === 0 ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    <span>Diferencia:</span>
                    <span>{formatCurrency(diferencia)}</span>
                </div>
            </div>

             <div className="flex justify-end space-x-2 pt-4 mt-4">
                <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={diferencia !== 0 || selectedPagoIds.length === 0}>Confirmar Pago</Button>
            </div>
        </Modal>
    );
};

export default RegistrarPagoModal;