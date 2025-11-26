import React, { useState, useMemo } from 'react';
import { Supplier, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from '../icons/Icons';
import SupplierFormModal from './SupplierFormModal';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';
import Input from '../ui/Input';

interface SuppliersViewProps {
    suppliers: Supplier[];
    onSave: (supplier: Supplier) => Promise<void>;
    onDelete: (supplierId: string) => Promise<void>;
    permissions: Permissions;
}

const ITEMS_PER_PAGE = 15;

const SuppliersView: React.FC<SuppliersViewProps> = ({ suppliers, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers;
        const term = searchTerm.toLowerCase();
        return suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(term) ||
            supplier.idNumber.toLowerCase().includes(term)
        );
    }, [suppliers, searchTerm]);

    const { 
        paginatedData, 
        currentPage, 
        totalPages, 
        setCurrentPage,
        totalItems
    } = usePagination(filteredSuppliers, ITEMS_PER_PAGE);

    const handleOpenModal = (supplier: Supplier | null) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleSaveSupplier = async (supplier: Supplier) => {
        await onSave(supplier);
        setIsModalOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <CardTitle>Gestión de Proveedores</CardTitle>
                        <div className="w-full sm:w-auto max-w-xs">
                             <Input 
                                label=""
                                id="search-suppliers" 
                                placeholder="Buscar por nombre o RIF..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                icon={<SearchIcon className="w-4 h-4 text-gray-400"/>} 
                            />
                        </div>
                        {permissions['proveedores.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Proveedor
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">RIF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Razón Social</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dirección</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(supplier => (
                                <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">{supplier.idNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{supplier.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{supplier.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{supplier.address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        {permissions['proveedores.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(supplier)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['proveedores.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar este proveedor? Esta acción no se puede deshacer.')) {
                                                    await onDelete(supplier.id);
                                                }
                                            }}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                            <tr>
                                <td className="px-6 py-3 text-left text-sm text-gray-900 dark:text-gray-100" colSpan={5}>
                                    Total de Proveedores (Filtrados): {totalItems}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                     {paginatedData.length === 0 && (
                        <p className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron proveedores.</p>
                    )}
                </div>
                 <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </Card>

            <SupplierFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSupplier}
                supplier={editingSupplier}
            />
        </>
    );
};

export default SuppliersView;