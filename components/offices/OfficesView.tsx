import React, { useState } from 'react';
import { Office, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon } from '../icons/Icons';
import OfficeFormModal from './OfficeFormModal';

interface OfficesViewProps {
    offices: Office[];
    onSave: (office: Office) => Promise<void>;
    onDelete: (officeId: string) => Promise<void>;
    permissions: Permissions;
}

const OfficesView: React.FC<OfficesViewProps> = ({ offices, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffice, setEditingOffice] = useState<Office | null>(null);

    const handleOpenModal = (office: Office | null) => {
        setEditingOffice(office);
        setIsModalOpen(true);
    };

    const handleSave = async (office: Office) => {
        await onSave(office);
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
                        <CardTitle>Gestión de Oficinas y Sucursales</CardTitle>
                        {permissions['offices.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nueva Oficina
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {offices.map(office => (
                                <tr key={office.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{office.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{office.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{office.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{office.phone}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {permissions['offices.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(office)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['offices.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar esta oficina? Esta acción no se puede deshacer.')) {
                                                    await onDelete(office.id);
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

            <OfficeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                office={editingOffice}
            />
        </div>
    );
};

export default OfficesView;