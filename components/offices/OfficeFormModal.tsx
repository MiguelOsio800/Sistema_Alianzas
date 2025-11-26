

import React, { useState, useEffect } from 'react';
import { Office } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface OfficeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (office: Office) => void;
    office: Office | null;
}

const OfficeFormModal: React.FC<OfficeFormModalProps> = ({ isOpen, onClose, onSave, office }) => {
    const [formData, setFormData] = useState<Partial<Office>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(office || { code: '', name: '', address: '', phone: '' });
        }
    }, [office, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Office);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={office ? 'Editar Oficina' : 'Nueva Oficina'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="code" label="Código de Oficina" value={formData.code || ''} onChange={handleChange} required />
                    <Input name="name" label="Nombre de la Oficina" value={formData.name || ''} onChange={handleChange} required />
                </div>
                <Input name="address" label="Dirección" value={formData.address || ''} onChange={handleChange} required />
                <Input name="phone" label="Teléfono" value={formData.phone || ''} onChange={handleChange} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default OfficeFormModal;