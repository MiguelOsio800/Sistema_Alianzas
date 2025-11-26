
import React, { useState, useEffect, useMemo } from 'react';
import { AsientoManual, CuentaContable, AsientoManualEntry } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { PlusIcon, TrashIcon } from '../icons/Icons';
import { useToast } from '../ui/ToastProvider';

interface AsientoManualModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asiento: AsientoManual) => void;
    cuentasContables: CuentaContable[];
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AsientoManualModal: React.FC<AsientoManualModalProps> = ({ isOpen, onClose, onSave, cuentasContables }) => {
    const { addToast } = useToast();
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [descripcion, setDescripcion] = useState('');
    const [entries, setEntries] = useState<AsientoManualEntry[]>([
        { id: `row-${Date.now()}`, cuentaId: '', debe: 0, haber: 0 },
        { id: `row-${Date.now() + 1}`, cuentaId: '', debe: 0, haber: 0 },
    ]);

    const { totalDebe, totalHaber, isBalanced } = useMemo(() => {
        const debe = entries.reduce((sum, entry) => sum + (entry.debe || 0), 0);
        const haber = entries.reduce((sum, entry) => sum + (entry.haber || 0), 0);
        return { totalDebe: debe, totalHaber: haber, isBalanced: Math.abs(debe - haber) < 0.001 };
    }, [entries]);

    const handleAddEntry = () => {
        setEntries([...entries, { id: `row-${Date.now()}`, cuentaId: '', debe: 0, haber: 0 }]);
    };

    const handleRemoveEntry = (id: string) => {
        if (entries.length > 2) {
            setEntries(entries.filter(entry => entry.id !== id));
        } else {
            addToast({ type: 'warning', title: 'Acción no permitida', message: 'Un asiento debe tener al menos dos líneas.' });
        }
    };

    const handleEntryChange = (id: string, field: keyof Omit<AsientoManualEntry, 'id'>, value: string | number) => {
        setEntries(entries.map(entry => {
            if (entry.id === id) {
                const updatedEntry = { ...entry, [field]: value };
                if (field === 'debe' && Number(value) > 0) updatedEntry.haber = 0;
                if (field === 'haber' && Number(value) > 0) updatedEntry.debe = 0;
                return updatedEntry;
            }
            return entry;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            addToast({ type: 'error', title: 'Asiento Desbalanceado', message: 'El total del Debe y el Haber deben ser iguales.' });
            return;
        }
        if (entries.some(e => !e.cuentaId)) {
            addToast({ type: 'error', title: 'Cuentas Faltantes', message: 'Todas las líneas deben tener una cuenta contable seleccionada.' });
            return;
        }
        if (!descripcion.trim()) {
            addToast({ type: 'error', title: 'Descripción Requerida', message: 'Por favor, ingrese una descripción para el asiento.' });
            return;
        }

        const newAsiento: Omit<AsientoManual, 'id'> & {id?: string} = {
            fecha,
            descripcion,
            entries,
        };
        onSave(newAsiento as AsientoManual);
        onClose();
    };
    
    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setFecha(new Date().toISOString().split('T')[0]);
            setDescripcion('');
            setEntries([
                { id: `row-${Date.now()}`, cuentaId: '', debe: 0, haber: 0 },
                { id: `row-${Date.now() + 1}`, cuentaId: '', debe: 0, haber: 0 },
            ]);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registro de Asiento Contable Manual" size="3xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <Input label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
                    </div>
                    <div className="md:col-span-2">
                        <Input label="Descripción del Asiento" value={descripcion} onChange={e => setDescripcion(e.target.value)} required placeholder="Ej: Registro de apertura de saldos" />
                    </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-2 border-y dark:border-gray-700 py-2">
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                                <Select label={index === 0 ? 'Cuenta Contable' : ''} value={entry.cuentaId} onChange={e => handleEntryChange(entry.id, 'cuentaId', e.target.value)}>
                                    <option value="">-- Seleccionar Cuenta --</option>
                                    {cuentasContables.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>)}
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <Input label={index === 0 ? 'Debe' : ''} type="number" step="0.01" value={entry.debe || ''} onChange={e => handleEntryChange(entry.id, 'debe', Number(e.target.value))} />
                            </div>
                            <div className="col-span-3">
                                <Input label={index === 0 ? 'Haber' : ''} type="number" step="0.01" value={entry.haber || ''} onChange={e => handleEntryChange(entry.id, 'haber', Number(e.target.value))} />
                            </div>
                            <div className="col-span-1 flex items-end h-full">
                                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveEntry(entry.id)} className="!p-2.5">
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
                
                <Button type="button" variant="secondary" onClick={handleAddEntry} className="w-full">
                    <PlusIcon className="w-4 h-4 mr-2" /> Agregar Línea
                </Button>

                <div className={`grid grid-cols-12 gap-2 p-3 rounded-md font-bold text-lg ${isBalanced && totalDebe > 0 ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    <div className="col-span-5 text-right">TOTALES:</div>
                    <div className="col-span-3 text-right font-mono">{formatCurrency(totalDebe)}</div>
                    <div className="col-span-3 text-right font-mono">{formatCurrency(totalHaber)}</div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={!isBalanced || totalDebe === 0}>Guardar Asiento</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AsientoManualModal;