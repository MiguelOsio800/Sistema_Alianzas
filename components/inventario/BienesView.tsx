import React, { useState, useMemo } from 'react';
import { Asset, Office, Permissions, AssetCategory } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, BuildingOfficeIcon, SearchIcon, ArrowLeftIcon } from '../icons/Icons';
import BienFormModal from './BienFormModal';
import Select from '../ui/Select';
import Input from '../ui/Input';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

const statusColors: { [key: string]: string } = {
    'Activo': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
    'En Mantenimiento': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
    'De Baja': 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
};

const ITEMS_PER_PAGE = 15;

interface BienesViewProps {
    assets: Asset[];
    offices: Office[];
    assetCategories: AssetCategory[];
    onSave: (asset: Asset) => Promise<void>;
    onDelete: (assetId: string) => Promise<void>;
    permissions: Permissions;
}

const BienesView: React.FC<BienesViewProps> = ({ assets, offices, assetCategories, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [selectedOffice, setSelectedOffice] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAssets = useMemo(() => {
        return assets
            .filter(asset => {
                if (selectedOffice === 'all') return true;
                if (selectedOffice === 'unassigned') return !asset.officeId;
                return asset.officeId === selectedOffice;
            })
            .filter(asset => {
                if (selectedCategory === 'all') return true;
                return asset.categoryId === selectedCategory;
            })
            .filter(asset => {
                if (!searchTerm.trim()) return true;
                const term = searchTerm.toLowerCase();
                return (
                    asset.name.toLowerCase().includes(term) ||
                    asset.code.toLowerCase().includes(term)
                );
            });
    }, [assets, selectedOffice, selectedCategory, searchTerm]);

    const { 
        paginatedData, 
        currentPage, 
        totalPages, 
        setCurrentPage,
        totalItems
    } = usePagination(filteredAssets, ITEMS_PER_PAGE);

    const totals = useMemo(() => {
        return filteredAssets.reduce((acc, asset) => {
            acc.purchaseValue += asset.purchaseValue || 0;
            return acc;
        }, { purchaseValue: 0 });
    }, [filteredAssets]);

    const handleOpenModal = (asset: Asset | null) => {
        setEditingAsset(asset);
        setIsModalOpen(true);
    };

    const handleSave = async (asset: Asset) => {
        await onSave(asset);
        setIsModalOpen(false);
    };

    const getOfficeName = (officeId?: string) => {
        if (!officeId) return 'General';
        return offices.find(o => o.id === officeId)?.name || 'Desconocida';
    };
    
    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return 'Sin Categoría';
        return assetCategories.find(c => c.id === categoryId)?.name || 'Desconocida';
    };

    const noResultsMessage = (selectedOffice !== 'all' || selectedCategory !== 'all' || searchTerm)
        ? 'No hay bienes que coincidan con su búsqueda.'
        : 'No se han registrado bienes.';

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
                             <BuildingOfficeIcon className="w-8 h-8 text-primary-500" />
                             <div>
                                <CardTitle>Inventario de Bienes de la Empresa</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Activos fijos y otros bienes propiedad de la compañía.</p>
                             </div>
                        </div>
                        {permissions['inventario-bienes.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Bien
                            </Button>
                        )}
                    </div>
                     <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                         <div className="w-full">
                             <Select
                                label="Filtrar por Categoría"
                                id="category-filter"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="all">Todas las Categorías</option>
                                {assetCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="w-full">
                             <Select
                                label="Filtrar por Oficina"
                                id="office-filter"
                                value={selectedOffice}
                                onChange={(e) => setSelectedOffice(e.target.value)}
                            >
                                <option value="all">Todas las Oficinas</option>
                                <option value="unassigned">General (Sin Asignar)</option>
                                {offices.map(office => (
                                    <option key={office.id} value={office.id}>
                                        {office.name}
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div className="w-full">
                            <Input
                                label="Buscar por Nombre o Código"
                                id="search-assets"
                                placeholder="Ej: Laptop Dell, COMP-001..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<SearchIcon className="w-4 h-4 text-gray-400" />}
                            />
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nombre / Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Oficina</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha Compra</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valor Compra</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(asset => (
                                <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-normal">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{asset.name}</div>
                                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400">{asset.code}</div>
                                        {asset.description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{asset.description}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{getCategoryName(asset.categoryId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{getOfficeName(asset.officeId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{asset.purchaseDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800 dark:text-gray-200">{`$${asset.purchaseValue.toLocaleString('en-US')}`}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>
                                            {asset.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        {permissions['inventario-bienes.edit'] && <Button variant="secondary" size="sm" onClick={() => handleOpenModal(asset)}><EditIcon className="w-4 h-4"/></Button>}
                                        {permissions['inventario-bienes.delete'] && <Button variant="danger" size="sm" onClick={async () => {
                                            if (window.confirm(`¿Está seguro de que desea eliminar el bien '${asset.name}'? Esta acción no se puede deshacer.`)) {
                                                await onDelete(asset.id);
                                            }
                                        }}><TrashIcon className="w-4 h-4"/></Button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                            <tr>
                                <td className="px-6 py-3 text-left text-sm" colSpan={4}>
                                    Total de Bienes (Filtrados): {totalItems}
                                </td>
                                <td className="px-6 py-3 text-right text-sm">
                                    {`$${totals.purchaseValue.toLocaleString('en-US')}`}
                                </td>
                                <td className="px-6 py-3" colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                     {paginatedData.length === 0 && <p className="text-center py-10 text-gray-500">{noResultsMessage}</p>}
                </div>
                 <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            </Card>

            <BienFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                asset={editingAsset}
                offices={offices}
                assetCategories={assetCategories}
            />
        </div>
    );
};

export default BienesView;