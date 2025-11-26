
import React, { useState, useEffect } from 'react';
import { ShippingType } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ShippingTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (shippingType: ShippingType) => void;
    shippingType: ShippingType | null;
}

const ShippingTypeFormModal: React.FC<ShippingTypeFormModalProps> = ({ isOpen, onClose, onSave, shippingType }) => {
    const [formData, setFormData] = useState<Partial<ShippingType>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(shippingType || { name: '' });
        }
    }, [shippingType, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as ShippingType);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={shippingType ? 'Editar Tipo de Envío' : 'Nuevo Tipo de Envío'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Nombre del Tipo de Envío" value={formData.name || ''} onChange={handleChange} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default ShippingTypeFormModal;
