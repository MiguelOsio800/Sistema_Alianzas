import React, { useState } from 'react';
import { ShippingType, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon } from '../icons/Icons';
import ShippingTypeFormModal from './ShippingTypeFormModal';

interface ShippingTypesViewProps {
    shippingTypes: ShippingType[];
    onSave: (shippingType: ShippingType) => Promise<void>;
    onDelete: (shippingTypeId: string) => Promise<void>;
    permissions: Permissions;
}

const ShippingTypesView: React.FC<ShippingTypesViewProps> = ({ shippingTypes, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShippingType, setEditingShippingType] = useState<ShippingType | null>(null);

    const handleOpenModal = (shippingType: ShippingType | null) => {
        setEditingShippingType(shippingType);
        setIsModalOpen(true);
    };

    const handleSave = async (shippingType: ShippingType) => {
        await onSave(shippingType);
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
                        <CardTitle>Gestión de Tipos de Envío</CardTitle>
                        {permissions['shipping-types.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Tipo de Envío
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
                            {shippingTypes.map(st => (
                                <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{st.name}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {permissions['shipping-types.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(st)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['shipping-types.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar este tipo de envío? Esta acción no se puede deshacer.')) {
                                                    await onDelete(st.id);
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

            <ShippingTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                shippingType={editingShippingType}
            />
        </div>
    );
};

export default ShippingTypesView;