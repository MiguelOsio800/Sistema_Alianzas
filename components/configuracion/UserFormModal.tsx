import React, { useState, useEffect, useMemo } from 'react';
import { User, Role, Office } from '../../types';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { EyeIcon, EyeOffIcon } from '../icons/Icons';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: User) => void;
    user: User | null;
    roles: Role[];
    offices: Office[];
    currentUser: User;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, user, roles, offices, currentUser }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const availableRoles = useMemo(() => {
        const techRole = roles.find(r => r.name === 'Soporte Técnico');
        if (currentUser.username === 'admin' && techRole) {
            return roles.filter(r => r.id !== techRole.id);
        }
        return roles;
    }, [roles, currentUser]);


    useEffect(() => {
        if (isOpen) {
            setFormData(user || { name: '', username: '', password: '', email: '', roleId: availableRoles[0]?.id, officeId: '' });
            setShowPassword(false);
            setErrors({});
        }
    }, [user, isOpen, availableRoles]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'El nombre completo es requerido.';
        if (!formData.username?.trim()) newErrors.username = 'El nombre de usuario es requerido.';
        if (!user && !formData.password?.trim()) { // Password is required only for new users
            newErrors.password = 'La contraseña es requerida para nuevos usuarios.';
        }
        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'El formato del correo electrónico es inválido.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData as User);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuario' : 'Nuevo Usuario'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input name="name" label="Nombre Completo" value={formData.name || ''} onChange={handleChange} required error={errors.name} />
                <Input name="username" label="Usuario (para iniciar sesión)" value={formData.username || ''} onChange={handleChange} required autoComplete="username" error={errors.username}/>
                <Input name="email" label="Correo Electrónico (Opcional)" type="email" value={formData.email || ''} onChange={handleChange} error={errors.email} />
                
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={formData.password || ''}
                            onChange={handleChange}
                            required={!user}
                            placeholder={user ? 'Dejar en blanco para no cambiar' : ''}
                            className={`block w-full rounded-md border shadow-sm focus:ring-1 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-500'}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>

                <Select name="roleId" label="Rol" value={formData.roleId || ''} onChange={handleChange} required>
                    {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                </Select>
                <Select name="officeId" label="Oficina Asignada (Opcional)" value={formData.officeId || ''} onChange={handleChange}>
                    <option value="">Ninguna (Acceso Global)</option>
                    {offices.map(office => (
                        <option key={office.id} value={office.id}>{office.name}</option>
                    ))}
                </Select>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;