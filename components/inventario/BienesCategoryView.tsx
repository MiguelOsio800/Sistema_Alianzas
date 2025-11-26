import React, { useState } from 'react';
import { AssetCategory, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon, TagIcon } from '../icons/Icons';
import BienesCategoryFormModal from './BienesCategoryFormModal';

interface BienesCategoryViewProps {
    categories: AssetCategory[];
    onSave: (category: AssetCategory) => Promise<void>;
    onDelete: (categoryId: string) => Promise<void>;
    permissions: Permissions;
}

const BienesCategoryView: React.FC<BienesCategoryViewProps> = ({ categories, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);

    const handleOpenModal = (category: AssetCategory | null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleSave = async (category: AssetCategory) => {
        await onSave(category);
        setIsModalOpen(false);
    };

    if (!permissions['bienes-categorias.view']) {
        return (
            <Card>
                <CardTitle>Acceso Denegado</CardTitle>
                <p>No tienes permiso para ver esta sección.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'inventario'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver a Inventario
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <TagIcon className="w-8 h-8 text-primary-500" />
                            <div>
                                <CardTitle>Categorías de Bienes de la Empresa</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Clasificaciones para los activos fijos y bienes.</p>
                            </div>
                        </div>
                        {permissions['bienes-categorias.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nueva Categoría
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre de la Categoría</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {categories.map(cat => (
                                <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {permissions['bienes-categorias.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(cat)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['bienes-categorias.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar esta categoría de bien? Esta acción no se puede deshacer.')) {
                                                    await onDelete(cat.id);
                                                }
                                            }}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {categories.length === 0 && <p className="text-center py-10 text-gray-500">No hay categorías de bienes registradas.</p>}
                </div>
            </Card>

            <BienesCategoryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                category={editingCategory}
            />
        </div>
    );
};

export default BienesCategoryView;