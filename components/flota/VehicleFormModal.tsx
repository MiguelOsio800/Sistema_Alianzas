

import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface VehicleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (vehicle: Vehicle) => void;
    vehicle: Vehicle | null;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({ isOpen, onClose, onSave, vehicle }) => {
    const [formData, setFormData] = useState<Partial<Vehicle>>({});
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(vehicle || { modelo: '', placa: '', driver: '', ano: new Date().getFullYear(), capacidadCarga: 1000, imageUrl: '' });
        }
    }, [vehicle, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'capacidadCarga' || name === 'ano' ? Number(value) : value }));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Vehicle);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="modelo" label="Modelo" value={formData.modelo || ''} onChange={handleChange} required />
                <Input name="placa" label="Placa" value={formData.placa || ''} onChange={handleChange} required />
                <Input name="driver" label="Conductor" value={formData.driver || ''} onChange={handleChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input name="ano" label="Año" type="number" value={formData.ano || ''} onChange={handleChange} required />
                    <Input name="capacidadCarga" label="Capacidad (Kg)" type="number" value={formData.capacidadCarga || ''} onChange={handleChange} required />
                </div>
                 <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Imagen del Vehículo (URL o Subir)
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="imageUrl"
                            name="imageUrl"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm sm:text-sm bg-gray-50 dark:bg-gray-700"
                            placeholder="Pegar URL o subir archivo"
                            value={formData.imageUrl || ''} 
                            onChange={handleChange}
                        />
                        <Button 
                            variant="secondary" 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="shrink-0"
                        >
                            Subir...
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*"
                            className="hidden" 
                        />
                    </div>
                     {formData.imageUrl && (
                        <div className="mt-4 p-2 border rounded-lg bg-gray-100 dark:bg-gray-700/50 inline-block">
                            <img src={formData.imageUrl} alt="Vista previa" className="h-24 w-auto object-contain rounded-md" />
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default VehicleFormModal;