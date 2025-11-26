import React, { useState, useEffect } from 'react';
import { Asociado } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { SaveIcon } from '../icons/Icons';

interface DatosSocioTabProps {
    asociado: Asociado;
    onSave: (asociado: Asociado) => void;
}

const DatosSocioTab: React.FC<DatosSocioTabProps> = ({ asociado, onSave }) => {
    const [formData, setFormData] = useState<Asociado>(asociado);

    useEffect(() => {
        setFormData(asociado);
    }, [asociado]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Código" name="codigo" value={formData.codigo} onChange={handleChange} required />
                    <Input label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Cédula" name="cedula" value={formData.cedula} onChange={handleChange} required />
                    <Input label="Fecha Nacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} required />
                    <Input label="Fecha Ingreso" name="fechaIngreso" type="date" value={formData.fechaIngreso} onChange={handleChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} required />
                    <Input label="Correo Electrónico" name="correoElectronico" type="email" value={formData.correoElectronico || ''} onChange={handleChange} />
                </div>
                <Input label="Dirección Habitación" name="direccion" value={formData.direccion} onChange={handleChange} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Status Socio" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                        <option value="Suspendido">Suspendido</option>
                    </Select>
                    <Input label="Observaciones" name="observaciones" value={formData.observaciones || ''} onChange={handleChange} />
                </div>
                 <div className="flex justify-end pt-4">
                    <Button type="submit">
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default DatosSocioTab;
