

import React, { useState, useEffect } from 'react';
import { AssetCategory } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface BienesCategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: AssetCategory) => void;
    category: AssetCategory | null;
}

const BienesCategoryFormModal: React.FC<BienesCategoryFormModalProps> = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState<Partial<AssetCategory>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(category || { name: '' });
        }
    }, [category, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name) {
             onSave(formData as AssetCategory);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Editar Categoría' : 'Nueva Categoría de Bien'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Nombre de la Categoría" value={formData.name || ''} onChange={handleChange} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default BienesCategoryFormModal;
