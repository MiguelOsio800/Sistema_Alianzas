import React, { useState, useEffect } from 'react';
import { PagoAsociado, CompanyInfo } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface PagoAsociadoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (pago: PagoAsociado) => void;
    pago: PagoAsociado | null;
    asociadoId: string;
    companyInfo: CompanyInfo;
}

const PagoAsociadoFormModal: React.FC<PagoAsociadoFormModalProps> = ({ isOpen, onClose, onSave, pago, asociadoId, companyInfo }) => {
    const [formData, setFormData] = useState<Partial<PagoAsociado>>({});
    const [montoBs, setMontoBs] = useState<number | ''>('');
    const [montoUsd, setMontoUsd] = useState<number | ''>('');
    const [lastEdited, setLastEdited] = useState<'bs' | 'usd'>('bs');

    const bcvRate = companyInfo.bcvRate || 1;

    useEffect(() => {
        if (isOpen) {
            const initialData = pago || {
                asociadoId,
                concepto: '',
                cuotas: '',
                montoBs: 0,
                montoUsd: 0,
                fechaVencimiento: new Date().toISOString().split('T')[0],
                status: 'Pendiente'
            };
            setFormData(initialData);
            setMontoBs(initialData.montoBs || '');
            setMontoUsd(initialData.montoUsd || (initialData.montoBs / bcvRate) || '');
            setLastEdited('bs');
        }
    }, [pago, isOpen, asociadoId, bcvRate]);

    useEffect(() => {
        if (lastEdited === 'bs' && typeof montoBs === 'number' && bcvRate > 0) {
            setMontoUsd(parseFloat((montoBs / bcvRate).toFixed(2)));
        }
    }, [montoBs, bcvRate, lastEdited]);

    useEffect(() => {
        if (lastEdited === 'usd' && typeof montoUsd === 'number' && bcvRate > 0) {
            setMontoBs(parseFloat((montoUsd * bcvRate).toFixed(2)));
        }
    }, [montoUsd, bcvRate, lastEdited]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMontoBsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastEdited('bs');
        setMontoBs(e.target.value === '' ? '' : parseFloat(e.target.value));
    };

    const handleMontoUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLastEdited('usd');
        setMontoUsd(e.target.value === '' ? '' : parseFloat(e.target.value));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = {
            ...formData,
            montoBs: typeof montoBs === 'number' ? montoBs : 0,
            montoUsd: typeof montoUsd === 'number' ? montoUsd : 0,
        };
        onSave(finalData as PagoAsociado);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={pago ? 'Editar Deuda/Concepto' : 'Nueva Deuda/Concepto'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="concepto" label="Descripción del Concepto" value={formData.concepto || ''} onChange={handleChange} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Input 
                            label="Importe (Bs.)" 
                            type="number" 
                            step="0.01" 
                            value={montoBs} 
                            onChange={handleMontoBsChange} 
                            required 
                        />
                    </div>
                    <div>
                        <Input 
                            label="Importe (USD)" 
                            type="number" 
                            step="0.01" 
                            value={montoUsd} 
                            onChange={handleMontoUsdChange}
                        />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">Tasa BCV: {bcvRate}</p>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="cuotas" label="Cuotas" placeholder="Ej: 41-45 o 10" value={formData.cuotas || ''} onChange={handleChange} />
                    <Input name="fechaVencimiento" label="Fecha de Vencimiento" type="date" value={formData.fechaVencimiento || ''} onChange={handleChange} />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PagoAsociadoFormModal;