import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface SupplierFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Supplier) => void;
    supplier: Supplier | null;
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSave, supplier }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(supplier || { name: '', idNumber: '', phone: '', address: '' });
            setErrors({});
        }
    }, [supplier, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'La Razón Social es requerida.';
        if (!formData.idNumber?.trim()) {
            newErrors.idNumber = 'El RIF es requerido.';
        } else {
            const idRegex = /^[JG]-?\d+$/i;
            if (!idRegex.test(formData.idNumber)) {
                newErrors.idNumber = 'Formato de RIF inválido. Use J- o G- seguido de números.';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData as Supplier);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="idNumber" label="RIF" value={formData.idNumber || ''} onChange={handleChange} required error={errors.idNumber} />
                <Input name="name" label="Razón Social" value={formData.name || ''} onChange={handleChange} required error={errors.name} />
                <Input name="phone" label="Teléfono de Contacto" value={formData.phone || ''} onChange={handleChange} />
                <Input name="address" label="Dirección Fiscal" value={formData.address || ''} onChange={handleChange} />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default SupplierFormModal;
