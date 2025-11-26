
import React, { useState } from 'react';
import { Client, Category, CompanyInfo, User, Role } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import { PlusIcon, EditIcon, TrashIcon, TagIcon, UsersIcon, BuildingOfficeIcon } from '../icons/Icons';

// Props for the entire settings view
interface SettingsViewProps {
    companyInfo: CompanyInfo;
    onCompanyInfoSave: (info: CompanyInfo) => void;
    categories: Category[];
    onCategoryUpdate: (categories: Category[]) => void;
    users: User[];
    onUserUpdate: (users: User[]) => void;
}

// Sub-component for Company Info
const CompanyInfoSettings: React.FC<{ info: CompanyInfo; onSave: (info: CompanyInfo) => void }> = ({ info, onSave }) => {
    const [formData, setFormData] = useState(info);
    
    React.useEffect(() => setFormData(info), [info]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        alert('Información de la empresa guardada.');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-6 h-6 mr-3 text-primary-500"/>
                    <CardTitle>Datos de la Empresa</CardTitle>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre de la Empresa" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="RIF" name="rif" value={formData.rif} onChange={handleChange} required />
                <Input label="Dirección Fiscal" name="address" value={formData.address} onChange={handleChange} required />
                <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} required />
                <div className="flex justify-end pt-2">
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            </form>
        </Card>
    );
};

// Sub-component for Category Management
const CategorySettings: React.FC<{ categories: Category[]; onUpdate: (cats: Category[]) => void }> = ({ categories, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const handleSave = (category: Category) => {
        let updatedCategories;
        if (category.id) {
            updatedCategories = categories.map(c => c.id === category.id ? category : c);
        } else {
            updatedCategories = [...categories, { ...category, id: `cat-${Date.now()}` }];
        }
        onUpdate(updatedCategories);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta categoría?')) {
            onUpdate(categories.filter(c => c.id !== id));
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                     <div className="flex items-center">
                        <TagIcon className="w-6 h-6 mr-3 text-primary-500"/>
                        <CardTitle>Gestión de Categorías</CardTitle>
                    </div>
                    <Button onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}>
                        <PlusIcon className="w-4 h-4 mr-2" /> Nueva Categoría
                    </Button>
                </div>
            </CardHeader>
            <table className="min-w-full">
                {/* ... table headers ... */}
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.id}>
                            <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">{cat.name}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <Button variant="secondary" size="sm" onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}><EditIcon className="w-4 h-4"/></Button>
                                <Button variant="danger" size="sm" onClick={() => handleDelete(cat.id)}><TrashIcon className="w-4 h-4"/></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <CategoryFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} category={editingCategory} />
        </Card>
    );
};

// Modal for Category Form
const CategoryFormModal: React.FC<{isOpen: boolean; onClose: () => void; onSave: (cat: Category) => void; category: Category | null}> = ({ isOpen, onClose, onSave, category }) => {
    const [name, setName] = useState('');
    React.useEffect(() => {
        setName(category?.name || '');
    }, [category, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: category?.id || '', name });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Editar Categoría' : 'Nueva Categoría'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre de la Categoría" value={name} onChange={e => setName(e.target.value)} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};


// Sub-component for User Management
const UserSettings: React.FC<{ users: User[]; onUpdate: (users: User[]) => void }> = ({ users, onUpdate }) => {
    // This is a simplified version. A real app would have more complex state management.
    const handleRoleChange = (userId: string, newRoleId: string) => {
        onUpdate(users.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u));
    };
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center">
                    <UsersIcon className="w-6 h-6 mr-3 text-primary-500"/>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                </div>
            </CardHeader>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4">{user.name}</td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">
                               <Select label="" value={user.roleId} onChange={e => handleRoleChange(user.id, e.target.value)}>
                                   <option value="role-admin">Administrador</option>
                                   <option value="role-op">Operador</option>
                               </Select>
                            </td>
                             <td className="px-6 py-4 text-right space-x-2">
                                <Button variant="secondary" size="sm"><EditIcon className="w-4 h-4"/></Button>
                                <Button variant="danger" size="sm"><TrashIcon className="w-4 h-4"/></Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
};


const SettingsView: React.FC<SettingsViewProps> = (props) => {
    return (
        <div className="space-y-8">
            <CompanyInfoSettings info={props.companyInfo} onSave={props.onCompanyInfoSave} />
            <CategorySettings categories={props.categories} onUpdate={props.onCategoryUpdate} />
            <UserSettings users={props.users} onUpdate={props.onUserUpdate} />
        </div>
    );
};

export default SettingsView;
