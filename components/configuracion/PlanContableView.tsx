

import React, { useState } from 'react';
import { CuentaContable, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon, BookOpenIcon } from '../icons/Icons';
import PlanCuentaFormModal from './PlanCuentaFormModal';
import { useToast } from '../ui/ToastProvider';

interface PlanContableViewProps {
    cuentas: CuentaContable[];
    setCuentas: React.Dispatch<React.SetStateAction<CuentaContable[]>>;
    permissions: Permissions;
}

const PlanContableView: React.FC<PlanContableViewProps> = ({ cuentas, setCuentas, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCuenta, setEditingCuenta] = useState<CuentaContable | null>(null);
    const { addToast } = useToast();

    const handleOpenModal = (cuenta: CuentaContable | null) => {
        setEditingCuenta(cuenta);
        setIsModalOpen(true);
    };

    const handleSave = (cuenta: CuentaContable) => {
        if (cuenta.id) { // Update
            setCuentas(cuentas.map(c => c.id === cuenta.id ? cuenta : c));
            addToast({ type: 'success', title: 'Cuenta Actualizada', message: `La cuenta '${cuenta.nombre}' se guardó.` });
        } else { // Create
            const newCuenta = { ...cuenta, id: `cta-${Date.now()}` };
            setCuentas([...cuentas, newCuenta]);
            addToast({ type: 'success', title: 'Cuenta Creada', message: `La cuenta '${newCuenta.nombre}' ha sido creada.` });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (cuentaId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta cuenta contable? Esta acción no se puede deshacer.')) {
            const cuentaNombre = cuentas.find(c => c.id === cuentaId)?.nombre || 'La cuenta';
            setCuentas(cuentas.filter(c => c.id !== cuentaId));
            addToast({ type: 'success', title: 'Cuenta Eliminada', message: `${cuentaNombre} ha sido eliminada.` });
        }
    };
    
    // Sort by code for a structured view
    const sortedCuentas = [...cuentas].sort((a, b) => a.codigo.localeCompare(b.codigo));

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
                        <div className="flex items-center gap-3">
                            <BookOpenIcon className="w-8 h-8 text-primary-500" />
                            <div>
                                <CardTitle>Plan de Cuentas Contable</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestione el catálogo de cuentas para la contabilidad de la empresa.</p>
                            </div>
                        </div>
                        {permissions?.create && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nueva Cuenta
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre de la Cuenta</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedCuentas.map(cuenta => (
                                <tr key={cuenta.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">{cuenta.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{cuenta.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cuenta.tipo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        {permissions?.edit && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(cuenta)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions?.delete && (
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(cuenta.id)}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && (
                 <PlanCuentaFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    cuenta={editingCuenta}
                />
            )}
        </div>
    );
};

export default PlanContableView;
