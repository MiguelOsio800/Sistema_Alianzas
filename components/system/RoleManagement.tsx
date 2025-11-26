import React, { useState } from 'react';
import { User, Role, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ShieldCheckIcon } from '../icons/Icons';
import RolePermissionModal from '../configuracion/RolePermissionModal';
import RoleFormModal from '../configuracion/RoleFormModal';

interface RoleManagementProps {
    users: User[];
    roles: Role[];
    onSaveRole: (role: Role) => Promise<void>;
    onDeleteRole: (roleId: string) => Promise<void>;
    onUpdateRolePermissions: (roleId: string, permissions: Permissions) => Promise<void>;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ users, roles, onSaveRole, onDeleteRole, onUpdateRolePermissions }) => {
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    
    const [isRoleFormModalOpen, setIsRoleFormModalOpen] = useState(false);
    const [editingRoleEntity, setEditingRoleEntity] = useState<Role | null>(null);

    const handleOpenRoleFormModal = (role: Role | null) => {
        setEditingRoleEntity(role);
        setIsRoleFormModalOpen(true);
    };
    
    const handleSaveRoleEntity = async (role: Role) => {
        await onSaveRole(role);
        setIsRoleFormModalOpen(false);
    };

    const handleOpenRolePermissionModal = (role: Role) => {
        setEditingRole(role);
        setIsRoleModalOpen(true);
    };

    const handleSaveRolePermissions = async (roleId: string, permissions: any) => {
        await onUpdateRolePermissions(roleId, permissions);
        setIsRoleModalOpen(false);
    };
    
    const isRoleInUse = (roleId: string) => users.some(u => u.roleId === roleId);

    return (
        <>
            {/* Role List Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <ShieldCheckIcon className="w-6 h-6 mr-3 text-primary-500" />
                            <CardTitle>Roles del Sistema</CardTitle>
                        </div>
                        <Button onClick={() => handleOpenRoleFormModal(null)}>
                            <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Rol
                        </Button>
                    </div>
                </CardHeader>
                <div className="space-y-2">
                    {roles.map(role => (
                        <div key={role.id} className="p-3 rounded-md bg-gray-100 dark:bg-gray-800/50 flex justify-between items-center gap-2">
                            <span className="font-medium text-sm text-gray-700 dark:text-gray-200 truncate">{role.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => handleOpenRolePermissionModal(role)} title="Editar Permisos">
                                    <ShieldCheckIcon className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleOpenRoleFormModal(role)} title="Editar Nombre del Rol">
                                    <EditIcon className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="danger" onClick={async () => {
                                    if (window.confirm(`¿Está seguro de que desea eliminar el rol '${role.name}'? Esta acción no se puede deshacer.`)) {
                                        await onDeleteRole(role.id);
                                    }
                                }} disabled={isRoleInUse(role.id)} title={isRoleInUse(role.id) ? 'Rol en uso, no se puede eliminar' : 'Eliminar rol'}>
                                    <TrashIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Modals */}
            <RoleFormModal
                isOpen={isRoleFormModalOpen}
                onClose={() => setIsRoleFormModalOpen(false)}
                onSave={handleSaveRoleEntity}
                role={editingRoleEntity}
            />

            {editingRole && (
                 <RolePermissionModal
                    isOpen={isRoleModalOpen}
                    onClose={() => setIsRoleModalOpen(false)}
                    onSave={handleSaveRolePermissions}
                    role={editingRole}
                />
            )}
        </>
    );
};

export default RoleManagement;