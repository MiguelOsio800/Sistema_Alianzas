import React, { useState, useMemo } from 'react';
import { Client, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, UserIcon, BuildingOfficeIcon, SearchIcon } from '../icons/Icons';
import ClientFormModal from './ClientFormModal';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';
import Input from '../ui/Input';

interface ClientsViewProps {
    clients: Client[];
    onSave: (client: Client) => Promise<void>;
    onDelete: (clientId: string) => Promise<void>;
    permissions: Permissions;
}

const ITEMS_PER_PAGE = 15;

const ClientsView: React.FC<ClientsViewProps> = ({ clients, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const term = searchTerm.toLowerCase();
        return clients.filter(client => 
            client.name.toLowerCase().includes(term) ||
            client.idNumber.toLowerCase().includes(term) ||
            (client.email && client.email.toLowerCase().includes(term))
        );
    }, [clients, searchTerm]);

    const { 
        paginatedData, 
        currentPage, 
        totalPages, 
        setCurrentPage,
        totalItems
    } = usePagination(filteredClients, ITEMS_PER_PAGE);

    const handleOpenModal = (client: Client | null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleSaveClient = async (client: Client) => {
        await onSave(client);
        setIsModalOpen(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <CardTitle>Gestión de Clientes</CardTitle>
                        <div className="w-full sm:w-auto max-w-xs">
                             <Input 
                                label=""
                                id="search-clients" 
                                placeholder="Buscar por nombre, RIF/CI o email..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                icon={<SearchIcon className="w-4 h-4 text-gray-400"/>} 
                            />
                        </div>
                        {permissions['clientes.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Cliente
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Identificación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre / Razón Social</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Correo Electrónico</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(client => (
                                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.clientType === 'empresa' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                            {client.clientType === 'empresa' ? <BuildingOfficeIcon className="w-4 h-4 mr-1.5"/> : <UserIcon className="w-4 h-4 mr-1.5"/>}
                                            {client.clientType === 'empresa' ? 'Empresa' : 'Persona'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">{client.idNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{client.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{client.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{client.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                        {permissions['clientes.edit'] && (
                                            <Button variant="secondary" size="sm" onClick={() => handleOpenModal(client)}><EditIcon className="w-4 h-4"/></Button>
                                        )}
                                        {permissions['clientes.delete'] && (
                                            <Button variant="danger" size="sm" onClick={async () => {
                                                if (window.confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
                                                    await onDelete(client.id);
                                                }
                                            }}><TrashIcon className="w-4 h-4"/></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold">
                            <tr>
                                <td className="px-6 py-3 text-left text-sm" colSpan={6}>
                                    Total de Clientes (Filtrados): {totalItems}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                     {paginatedData.length === 0 && (
                        <p className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron clientes.</p>
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

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveClient}
                client={editingClient}
            />
        </>
    );
};

export default ClientsView;