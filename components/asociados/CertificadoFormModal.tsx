import React, { useState, useEffect } from 'react';
import { Certificado } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface CertificadoFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (certificado: Certificado) => void;
    certificado: Certificado | null;
    vehiculoId: string;
}

const CertificadoFormModal: React.FC<CertificadoFormModalProps> = ({ isOpen, onClose, onSave, certificado, vehiculoId }) => {
    const [formData, setFormData] = useState<Partial<Certificado>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(certificado || {
                vehiculoId: vehiculoId,
                descripcion: '',
                fechaInicio: new Date().toISOString().split('T')[0],
                status: 'Activo'
            });
        }
    }, [certificado, isOpen, vehiculoId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Certificado);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={certificado ? 'Editar Certificado' : 'Nuevo Certificado'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="descripcion" label="Descripción del Certificado" value={formData.descripcion || ''} onChange={handleChange} required />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input name="fechaInicio" label="Fecha de Inicio" type="date" value={formData.fechaInicio || ''} onChange={handleChange} />
                    <Input name="fechaSuspension" label="Fecha de Suspensión" type="date" value={formData.fechaSuspension || ''} onChange={handleChange} />
                </div>
                <Input name="rutaVehiculo" label="Ruta del Vehículo" value={formData.rutaVehiculo || ''} onChange={handleChange} />
                <Select name="status" label="Estado del Certificado" value={formData.status || 'Activo'} onChange={handleChange}>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Excluido">Excluido</option>
                </Select>
                
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default CertificadoFormModal;