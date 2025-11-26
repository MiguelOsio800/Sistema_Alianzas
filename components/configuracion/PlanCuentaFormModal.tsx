
import React, { useState, useEffect } from 'react';
import { CuentaContable, TipoCuentaContable } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface PlanCuentaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cuenta: CuentaContable) => void;
    cuenta: CuentaContable | null;
}

const tiposDeCuenta: TipoCuentaContable[] = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto'];

const PlanCuentaFormModal: React.FC<PlanCuentaFormModalProps> = ({ isOpen, onClose, onSave, cuenta }) => {
    const [formData, setFormData] = useState<Partial<CuentaContable>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(cuenta || { codigo: '', nombre: '', tipo: 'Activo' });
        }
    }, [cuenta, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as CuentaContable);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={cuenta ? 'Editar Cuenta Contable' : 'Nueva Cuenta Contable'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="codigo" label="Código de Cuenta" value={formData.codigo || ''} onChange={handleChange} required placeholder="Ej: 1101-01" />
                    <Select
                        label="Tipo de Cuenta"
                        name="tipo"
                        value={formData.tipo || 'Activo'}
                        onChange={handleChange}
                        required
                    >
                        {tiposDeCuenta.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </Select>
                 </div>
                <Input name="nombre" label="Nombre de la Cuenta" value={formData.nombre || ''} onChange={handleChange} required placeholder="Ej: Caja Principal" />
               
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Cuenta</Button>
                </div>
            </form>
        </Modal>
    );
};

export default PlanCuentaFormModal;
