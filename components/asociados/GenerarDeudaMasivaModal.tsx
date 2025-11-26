import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface GenerarDeudaMasivaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: {
        concepto: string,
        cuotas: string,
        montoBs: number,
        montoUsd: number,
        fechaVencimiento: string,
        applyTo: 'Activo' | 'Todos'
    }) => void;
    companyInfo: CompanyInfo;
}

const GenerarDeudaMasivaModal: React.FC<GenerarDeudaMasivaModalProps> = ({ isOpen, onClose, onGenerate, companyInfo }) => {
    const [concepto, setConcepto] = useState('');
    const [cuotas, setCuotas] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState(new Date().toISOString().split('T')[0]);
    const [montoBs, setMontoBs] = useState<number | ''>('');
    const [montoUsd, setMontoUsd] = useState<number | ''>('');
    const [applyTo, setApplyTo] = useState<'Activo' | 'Todos'>('Activo');
    const [lastEdited, setLastEdited] = useState<'bs' | 'usd'>('bs');

    const bcvRate = companyInfo.bcvRate || 1;

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
        if (concepto && typeof montoBs === 'number' && montoBs > 0) {
            onGenerate({
                concepto,
                cuotas,
                montoBs,
                montoUsd: typeof montoUsd === 'number' ? montoUsd : 0,
                fechaVencimiento,
                applyTo,
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generar Deuda Masiva para Asociados">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Concepto de la Deuda" value={concepto} onChange={e => setConcepto(e.target.value)} required placeholder="Ej: Cuota de Mantenimiento Enero 2025" />
                
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
                    <Input label="Cuotas" placeholder="Ej: 1/12" value={cuotas} onChange={e => setCuotas(e.target.value)} />
                    <Input label="Fecha de Vencimiento" type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} required />
                </div>

                <Select label="Aplicar a" value={applyTo} onChange={e => setApplyTo(e.target.value as 'Activo' | 'Todos')}>
                    <option value="Activo">Solo a Socios Activos</option>
                    <option value="Todos">A Todos los Socios</option>
                </Select>
                
                <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Generar Deudas</Button>
                </div>
            </form>
        </Modal>
    );
};

export default GenerarDeudaMasivaModal;