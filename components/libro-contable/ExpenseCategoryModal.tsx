

import React, { useState, useEffect } from 'react';
import { ExpenseCategory } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface ExpenseCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: ExpenseCategory) => void;
    category: ExpenseCategory | null;
}

const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState<Partial<ExpenseCategory>>({});

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
        onSave(formData as ExpenseCategory);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Editar Categoría de Gasto' : 'Nueva Categoría de Gasto'}>
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

export default ExpenseCategoryModal;
