import React, { useState } from 'react';
import { Category, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon } from '../icons/Icons';

// Modal for Category Form
const CategoryFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (cat: Category) => void;
    category: Partial<Category> | null
}> = ({ isOpen, onClose, onSave, category }) => {
    const [formData, setFormData] = useState<Partial<Category>>({ id: '', name: '' });
    
    React.useEffect(() => {
        if (isOpen) {
            setFormData(category || { name: '' });
        }
    }, [category, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as Category);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={category?.id ? 'Editar Categoría' : 'Nueva Categoría'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Nombre de la Categoría" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </div>
            </form>
        </Modal>
    );
};

interface CategoryViewProps {
    categories: Category[];
    onSave: (category: Category) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    permissions: Permissions;
}

const CategoryView: React.FC<CategoryViewProps> = ({ categories, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

    const handleOpenModal = (category?: Category) => {
        setEditingCategory(category || null);
        setIsModalOpen(true);
    };
    
    const handleSaveCategory = async (category: Category) => {
        await onSave(category);
        setIsModalOpen(false);
    };
    
    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'configuracion'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver a Configuración
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gestión de Categorías de Mercancía</CardTitle>
                        {permissions['categories.create'] && (
                            <Button onClick={() => handleOpenModal()}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nueva Categoría
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {permissions['categories.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(cat)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['categories.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar esta categoría? Esta acción no se puede deshacer.')) {
                                                    await onDelete(cat.id);
                                                }
                                            }}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            <CategoryFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveCategory} 
                category={editingCategory} 
            />
        </div>
    );
};

export default CategoryView;