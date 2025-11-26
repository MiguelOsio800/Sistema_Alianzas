
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface InventoryItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: InventoryItem) => void;
    item: InventoryItem | null;
}

const InventoryItemFormModal: React.FC<InventoryItemFormModalProps> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(item || { 
                sku: '', 
                name: '', 
                description: '', 
                stock: 0, 
                unit: 'unidad' 
            });
        }
    }, [item, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as InventoryItem);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Editar Artículo' : 'Nuevo Artículo de Inventario'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Nombre del Artículo" value={formData.name || ''} onChange={handleChange} required />
                <Input name="sku" label="SKU (Código)" value={formData.sku || ''} onChange={handleChange} required />
                <Input name="description" label="Descripción" value={formData.description || ''} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                    <Input name="stock" label="Stock Inicial" type="number" value={formData.stock || ''} onChange={handleChange} required />
                    <Select name="unit" label="Unidad" value={formData.unit || 'unidad'} onChange={handleChange}>
                        <option value="unidad">Unidad</option>
                        <option value="caja">Caja</option>
                        <option value="kg">Kg</option>
                        <option value="m">Metro</option>
                    </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Artículo</Button>
                </div>
            </form>
        </Modal>
    );
};

export default InventoryItemFormModal;
