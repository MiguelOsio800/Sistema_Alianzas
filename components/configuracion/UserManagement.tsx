import React, { useState, useMemo } from 'react';
import { User, Role, Office, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, UsersIcon, SearchIcon } from '../icons/Icons';
import UserFormModal from './UserFormModal';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';
import Input from '../ui/Input';


interface UserManagementProps {
    users: User[];
    roles: Role[];
    offices: Office[];
    onSaveUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
    currentUser: User;
    userPermissions: Permissions;
}

const ITEMS_PER_PAGE = 5;

const UserManagement: React.FC<UserManagementProps> = ({ users, roles, offices, onSaveUser, onDeleteUser, currentUser, userPermissions }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowercasedTerm = searchTerm.toLowerCase();
        return users.filter(user =>
            user.name.toLowerCase().includes(lowercasedTerm) ||
            user.username.toLowerCase().includes(lowercasedTerm)
        );
    }, [users, searchTerm]);

    const {
        paginatedData,
        currentPage,
        totalPages,
        setCurrentPage,
        totalItems,
    } = usePagination(filteredUsers, ITEMS_PER_PAGE);


    const handleOpenUserModal = (user: User | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (user: User) => {
        await onSaveUser(user);
        setIsUserModalOpen(false);
    };

    const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.name || 'N/A';
    const getOfficeName = (officeId?: string) => offices.find(o => o.id === officeId)?.name || 'Sin Asignar';

    const canEditUser = (target: User): boolean => {
        const targetUsername = target.username;
        if (['tecnologia', 'cooperativa'].includes(targetUsername) && !userPermissions['config.users.edit_protected']) {
            return false;
        }

        const techRoleId = roles.find(r => r.name === 'Soporte Técnico')?.id;
        if (target.roleId === techRoleId && !userPermissions['config.users.manage_tech_users']) {
            return false;
        }
        return true;
    };
    
    const canDeleteUser = (target: User): boolean => {
        if (['tecnologia', 'cooperativa'].includes(target.username)) return false;
        if (currentUser.id === target.id) return false;
        const techRoleId = roles.find(r => r.name === 'Soporte Técnico')?.id;
        if (target.roleId === techRoleId && !userPermissions['config.users.manage_tech_users']) {
            return false;
        }
        return true;
    };


    return (
        <div className="space-y-6">
            {/* User List Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div className="flex items-center">
                            <UsersIcon className="w-6 h-6 mr-3 text-primary-500" />
                            <CardTitle>Lista de Usuarios</CardTitle>
                        </div>
                         <div className="w-full sm:w-auto max-w-xs">
                             <Input 
                                label=""
                                id="search-users" 
                                placeholder="Buscar por nombre o usuario..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                icon={<SearchIcon className="w-4 h-4 text-gray-400"/>} 
                            />
                        </div>
                         <Button onClick={() => handleOpenUserModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Usuario
                        </Button>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Oficina Asignada</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map(user => {
                                const isEditable = canEditUser(user);
                                const isDeletable = canDeleteUser(user);
                                return (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getRoleName(user.roleId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getOfficeName(user.officeId)}</td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenUserModal(user)} disabled={!isEditable}><EditIcon className="w-4 h-4"/></Button>
                                        <Button variant="danger" size="sm" onClick={async () => {
                                            if (window.confirm(`¿Está seguro de que desea eliminar al usuario '${user.name}'? Esta acción no se puede deshacer.`)) {
                                                await onDeleteUser(user.id);
                                            }
                                        }} disabled={!isDeletable}><TrashIcon className="w-4 h-4"/></Button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {paginatedData.length === 0 && (
                        <p className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron usuarios.</p>
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

            <UserFormModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
                roles={roles}
                offices={offices}
                currentUser={currentUser}
            />
        </div>
    );
};

export default UserManagement;