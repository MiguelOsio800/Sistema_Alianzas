import React, { useState, useMemo } from 'react';
import { Asociado, CompanyInfo, Invoice, PagoAsociado } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import Select from '../ui/Select';

interface GenerarDeudaProduccionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (pago: PagoAsociado) => void;
    asociado: Asociado;
    invoices: Invoice[];
    companyInfo: CompanyInfo;
}

type DebtType = 'pasajeros' | 'carga';

const formatCurrency = (amount: number) => amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const GenerarDeudaProduccionModal: React.FC<GenerarDeudaProduccionModalProps> = ({ isOpen, onClose, onGenerate, asociado, invoices, companyInfo }) => {
    const { addToast } = useToast();
    const [debtType, setDebtType] = useState<DebtType>('pasajeros');

    // State for Pasajeros
    const [pasajerosTarifa, setPasajerosTarifa] = useState<'divisa' | 'bs'>('divisa');
    const bcvRate = companyInfo.bcvRate || 1;

    // State for Carga
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [calculation, setCalculation] = useState<{ total: number; debt: number } | null>(null);

    const handleCalculateCarga = () => {
        if (!startDate || !endDate) {
            addToast({ type: 'warning', title: 'Fechas Requeridas', message: 'Por favor, seleccione un rango de fechas.' });
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');

        const relevantInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= start && invDate <= end;
        });

        const totalFacturado = relevantInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const debtAmount = totalFacturado * 0.25;

        setCalculation({ total: totalFacturado, debt: debtAmount });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        let newPago: Omit<PagoAsociado, 'id' | 'reciboId'> | null = null;
        
        if (debtType === 'pasajeros') {
            const montoBs = pasajerosTarifa === 'divisa' ? 50 * bcvRate : 70 * bcvRate;
            newPago = {
                asociadoId: asociado.id,
                concepto: `Producción de Pasajeros (Tarifa ${pasajerosTarifa === 'divisa' ? '$50' : '$70'})`,
                cuotas: 'Única',
                montoBs: montoBs,
                montoUsd: montoBs / bcvRate,
                fechaVencimiento: new Date().toISOString().split('T')[0],
                status: 'Pendiente'
            };
        } else { // Carga
            if (!calculation || calculation.debt <= 0) {
                addToast({ type: 'warning', title: 'Cálculo Requerido', message: 'Debe calcular la deuda antes de generarla.' });
                return;
            }
            newPago = {
                asociadoId: asociado.id,
                concepto: `Producción de Carga Semanal (${startDate} al ${endDate})`,
                cuotas: 'Única',
                montoBs: calculation.debt,
                montoUsd: calculation.debt / bcvRate,
                fechaVencimiento: new Date().toISOString().split('T')[0],
                status: 'Pendiente'
            };
        }
        
        if (newPago) {
            onGenerate(newPago as PagoAsociado);
            addToast({ type: 'success', title: 'Deuda Generada', message: `Se generó la deuda por ${newPago.concepto}` });
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Generar Deuda por Producción para ${asociado.nombre}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Debt Type Selector */}
                <div className="flex rounded-md shadow-sm">
                    <button type="button" onClick={() => setDebtType('pasajeros')} className={`px-4 py-2 text-sm font-medium border rounded-l-md w-1/2 ${debtType === 'pasajeros' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}>
                        Transporte de Pasajeros
                    </button>
                    <button type="button" onClick={() => setDebtType('carga')} className={`px-4 py-2 text-sm font-medium border rounded-r-md w-1/2 ${debtType === 'carga' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}>
                        Transporte de Carga
                    </button>
                </div>

                {/* Pasajeros Section */}
                {debtType === 'pasajeros' && (
                    <div className="p-4 border rounded-md dark:border-gray-600 space-y-3">
                        <h3 className="font-semibold">Tarifa Fija para Pasajeros</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione la tarifa a aplicar para generar la deuda.</p>
                        <Select label="Tarifa" value={pasajerosTarifa} onChange={e => setPasajerosTarifa(e.target.value as any)}>
                            <option value="divisa">Pago en Divisa Física ($50.00)</option>
                            <option value="bs">Pago en Bolívares ($70.00 equiv.)</option>
                        </Select>
                         <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
                            <p className="text-sm">Monto a registrar en Bolívares:</p>
                            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                {formatCurrency(pasajerosTarifa === 'divisa' ? 50 * bcvRate : 70 * bcvRate)}
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Carga Section */}
                {debtType === 'carga' && (
                    <div className="p-4 border rounded-md dark:border-gray-600 space-y-3">
                        <h3 className="font-semibold">Cálculo Semanal para Carga (25%)</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione el rango de fechas para calcular la producción del asociado.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Desde" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <Input label="Hasta" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                        <Button type="button" variant="secondary" onClick={handleCalculateCarga} className="w-full">Calcular Producción</Button>
                        {calculation && (
                             <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-center">
                                <p className="text-sm">Total Facturado en período: Bs. {formatCurrency(calculation.total)}</p>
                                <p className="text-sm mt-2">Monto de Deuda (25%):</p>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                    {formatCurrency(calculation.debt)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Generar Deuda</Button>
                </div>
            </form>
        </Modal>
    );
};

export default GenerarDeudaProduccionModal;