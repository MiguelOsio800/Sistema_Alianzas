import React, { useState } from 'react';
import { CuentaContable, Permissions } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, BookOpenIcon } from '../icons/Icons';
import PlanCuentaFormModal from './PlanCuentaFormModal';

interface PlanContableManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    cuentas: CuentaContable[];
    onSave: (cuenta: CuentaContable) => void;
    onDelete: (cuentaId: string) => void;
    permissions: Permissions;
}

const PlanContableManagementModal: React.FC<PlanContableManagementModalProps> = ({ isOpen, onClose, cuentas, onSave, onDelete, permissions }) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingCuenta, setEditingCuenta] = useState<CuentaContable | null>(null);

    const handleOpenFormModal = (cuenta: CuentaContable | null) => {
        setEditingCuenta(cuenta);
        setIsFormModalOpen(true);
    };

    const handleSave = (cuenta: CuentaContable) => {
        onSave(cuenta);
        setIsFormModalOpen(false); // Close form modal on save
    };

    const sortedCuentas = [...cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo));

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Plan de Cuentas Contable" size="3xl">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Gestione el catálogo de cuentas para la contabilidad.
                    </p>
                    {permissions['plan-contable.create'] && (
                        <Button onClick={() => handleOpenFormModal(null)}>
                            <PlusIcon className="w-4 h-4 mr-2" /> Nueva Cuenta
                        </Button>
                    )}
                </div>
                <div className="overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de la Cuenta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedCuentas.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">{cuenta.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{cuenta.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cuenta.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        {permissions['plan-contable.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenFormModal(cuenta)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['plan-contable.delete'] && (
                                            <Button variant="danger" size="sm" onClick={() => onDelete(cuenta.id)}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedCuentas.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 font-semibold">No hay cuentas contables</p>
                            <p className="text-sm">Comience por añadir una nueva cuenta.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {isFormModalOpen && (
                 <PlanCuentaFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSave}
                    cuenta={editingCuenta}
                />
            )}
        </>
    );
};

export default PlanContableManagementModal;
