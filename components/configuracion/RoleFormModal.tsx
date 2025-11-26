
import React, { useState, useEffect } from 'react';
import { Role } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface RoleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: Role) => void;
    role: Role | null;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ isOpen, onClose, onSave, role }) => {
    const [formData, setFormData] = useState<Partial<Role>>({});

    useEffect(() => {
        if (isOpen) {
            setFormData(role || { name: '' });
        }
    }, [role, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name) {
            onSave(formData as Role);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={role ? 'Editar Rol' : 'Nuevo Rol'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input 
                    name="name" 
                    label="Nombre del Rol" 
                    value={formData.name || ''} 
                    onChange={handleChange} 
                    required 
                />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar Rol</Button>
                </div>
            </form>
        </Modal>
    );
};

export default RoleFormModal;
