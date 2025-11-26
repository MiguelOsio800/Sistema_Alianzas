


import React, { useState, useEffect } from 'react';
import { Asset, Office, AssetCategory } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { UploadIcon, XIcon } from '../icons/Icons';

interface BienFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (asset: Asset) => void;
    asset: Asset | null;
    offices: Office[];
    assetCategories: AssetCategory[];
}

const BienFormModal: React.FC<BienFormModalProps> = ({ isOpen, onClose, onSave, asset, offices, assetCategories }) => {
    const [formData, setFormData] = useState<Partial<Asset>>({});
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(asset || { 
                code: '',
                name: '',
                description: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                purchaseValue: 0,
                officeId: '',
                status: 'Activo',
                imageUrl: '',
                categoryId: assetCategories[0]?.id || ''
            });
        }
    }, [asset, isOpen, assetCategories]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, imageUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = () => {
        setFormData(prev => ({...prev, imageUrl: ''}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Asset);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'Editar Bien' : 'Nuevo Bien'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input name="name" label="Nombre del Bien" value={formData.name || ''} onChange={handleChange} required />
                    <Input name="code" label="Código / Etiqueta" value={formData.code || ''} onChange={handleChange} required />
                </div>
                <Input name="description" label="Descripción" value={formData.description || ''} onChange={handleChange} />
                 <Select name="categoryId" label="Categoría del Bien" value={formData.categoryId || ''} onChange={handleChange} required>
                    <option value="" disabled>Seleccione una categoría</option>
                    {assetCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </Select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <Input name="purchaseDate" label="Fecha de Compra" type="date" value={formData.purchaseDate || ''} onChange={handleChange} required />
                     <Input name="purchaseValue" label="Valor de Compra ($)" type="number" step="0.01" value={formData.purchaseValue || ''} onChange={handleChange} required />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select name="officeId" label="Oficina Asignada" value={formData.officeId || ''} onChange={handleChange}>
                        <option value="">General</option>
                        {offices.map(office => (
                            <option key={office.id} value={office.id}>{office.name}</option>
                        ))}
                    </Select>
                     <Select name="status" label="Estado" value={formData.status || 'Activo'} onChange={handleChange}>
                        <option value="Activo">Activo</option>
                        <option value="En Mantenimiento">En Mantenimiento</option>
                        <option value="De Baja">De Baja</option>
                    </Select>
                 </div>
                 
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Imagen del Bien</label>
                    <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                        <UploadIcon className="w-4 h-4 mr-2" /> Subir Imagen...
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    {formData.imageUrl && (
                        <div className="relative mt-4 inline-block">
                            <img src={formData.imageUrl} alt="Vista previa" className="h-24 object-contain rounded-md bg-gray-100 dark:bg-gray-700/50 p-2 border dark:border-gray-600" />
                            <button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors" aria-label="Remover imagen">
                                <XIcon className="w-3 h-3"/>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Bien</Button>
                </div>
            </form>
        </Modal>
    );
};

export default BienFormModal;