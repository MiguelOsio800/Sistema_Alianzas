
import React from 'react';
import { CompanyInfo, User, Role, Permissions, Office } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { BuildingOfficeIcon, UploadIcon, UsersIcon, SettingsIcon, XIcon, PackageIcon, ImageIcon, BookOpenIcon } from '../icons/Icons';
import UserManagement from './UserManagement';
import { useToast } from '../ui/ToastProvider';
import { CONFIG_SUB_NAV_ITEMS } from '../../constants';
import AccountingTile from '../libro-contable/AccountingTile';
import RoleManagement from '../system/RoleManagement';
import { apiFetch } from '../../utils/api';


interface ConfiguracionViewProps {
    companyInfo: CompanyInfo;
    onCompanyInfoSave: (info: CompanyInfo) => Promise<void>;
    users: User[];
    roles: Role[];
    offices: Office[];
    onSaveUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
    permissions: Permissions;
    currentUser: User;
    onSaveRole: (role: Role) => Promise<void>;
    onDeleteRole: (roleId: string) => Promise<void>;
    onUpdateRolePermissions: (roleId: string, permissions: Permissions) => Promise<void>;
}


const CompanyInfoSettings: React.FC<{ info: CompanyInfo; onSave: (info: CompanyInfo) => Promise<void>; canEdit: boolean }> = ({ info, onSave, canEdit }) => {
    const [formData, setFormData] = React.useState(info);
    const logoFileInputRef = React.useRef<HTMLInputElement>(null);
    const bgFileInputRef = React.useRef<HTMLInputElement>(null);
    const { addToast } = useToast();
    const [isFetchingRate, setIsFetchingRate] = React.useState(false);
    
    React.useEffect(() => setFormData(info), [info]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? Number(value) : value });
    };

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'loginImageUrl') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setFormData({ ...formData, [field]: reader.result as string }); };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRemoveImage = (field: 'logoUrl' | 'loginImageUrl') => {
        setFormData(prev => ({...prev, [field]: ''}));
    };

    const handleFetchBcvRate = async () => {
        setIsFetchingRate(true);
        addToast({ type: 'info', title: 'Consultando Tasa', message: 'Obteniendo tasa de cambio actualizada desde el servidor...' });
        try {
            const response = await apiFetch<{ rate: number }>('/company-info/bcv-rate');
            
            if (response && typeof response.rate === 'number') {
                const rate = response.rate;
                setFormData(prev => ({ ...prev, bcvRate: rate }));
                addToast({ type: 'success', title: 'Tasa Actualizada', message: `Tasa BCV obtenida: ${rate}` });
            } else {
                throw new Error('Respuesta inválida del servidor.');
            }
        } catch (error: any) {
            console.error("Error al obtener la tasa del BCV desde el backend:", error);
            addToast({ type: 'error', title: 'Error', message: error.message || 'No se pudo obtener la tasa del BCV automáticamente.' });
        } finally {
            setIsFetchingRate(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-6 h-6 mr-3 text-primary-500"/>
                    <CardTitle>Datos de la Empresa</CardTitle>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <fieldset disabled={!canEdit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Título de la Aplicación" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="RIF" name="rif" value={formData.rif} onChange={handleChange} required />
                    </div>
                    <Input label="Dirección Fiscal" name="address" value={formData.address} onChange={handleChange} required />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} required />
                        <Input label="Código de Habilitación Postal" name="postalLicense" value={formData.postalLicense || ''} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Costo por Kg (Bs.)" name="costPerKg" type="number" value={formData.costPerKg || ''} onChange={handleChange} required step="0.01"/>
                         <div>
                            <label htmlFor="bcvRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tasa Dólar BCV (Bs.)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="bcvRate"
                                    name="bcvRate"
                                    type="number"
                                    value={formData.bcvRate || ''}
                                    onChange={handleChange}
                                    required
                                    step="0.01"
                                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                />
                                <Button type="button" variant="secondary" onClick={handleFetchBcvRate} disabled={isFetchingRate || !canEdit} className="shrink-0">
                                    {isFetchingRate ? 'Buscando...' : 'Auto'}
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Consulte en <a href="https://www.bcv.org.ve/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">BCV</a> o use "Auto".
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Logo Uploader */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Logo de la Empresa
                            </label>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => logoFileInputRef.current?.click()}
                                className="mb-2"
                                disabled={!canEdit}
                            >
                                <UploadIcon className="w-4 h-4 mr-2" />
                                Subir Logo...
                            </Button>
                            <input
                                type="file"
                                ref={logoFileInputRef}
                                onChange={(e) => handleFileChange(e, 'logoUrl')}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="relative w-full h-20 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                {formData.logoUrl ? (
                                    <>
                                        <img src={formData.logoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain rounded" />
                                        {canEdit && <button
                                            type="button"
                                            onClick={() => handleRemoveImage('logoUrl')}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                                            aria-label="Remove logo"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>}
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center">
                                        <PackageIcon className="h-10 w-10 mx-auto text-primary-500" />
                                        <span className="block text-sm font-semibold mt-1">Logo de la empresa</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Background Image Uploader */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Imagen de Fondo del Login
                            </label>
                             <Button
                                type="button"
                                variant="secondary"
                                onClick={() => bgFileInputRef.current?.click()}
                                className="mb-2"
                                disabled={!canEdit}
                            >
                               <UploadIcon className="w-4 h-4 mr-2" />
                               Subir Fondo...
                            </Button>
                            <input
                                type="file"
                                ref={bgFileInputRef}
                                onChange={(e) => handleFileChange(e, 'loginImageUrl')}
                                accept="image/*"
                                className="hidden"
                            />
                            <div className="relative w-full h-20 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-2 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                {formData.loginImageUrl ? (
                                    <>
                                        <img src={formData.loginImageUrl} alt="Background preview" className="h-full w-full object-cover rounded-md" />
                                        {canEdit && <button
                                            type="button"
                                            onClick={() => handleRemoveImage('loginImageUrl')}
                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors"
                                            aria-label="Remove background"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>}
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center">
                                        <ImageIcon className="h-10 w-10 mx-auto" />
                                        <span className="block text-sm font-semibold mt-1">Vista previa del fondo</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                 </fieldset>
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={!canEdit}>Guardar Cambios</Button>
                </div>
            </form>
        </Card>
    );
};


const ConfiguracionView: React.FC<ConfiguracionViewProps> = (props) => {
    const {
        companyInfo, onCompanyInfoSave,
        users, roles, offices,
        onSaveUser, onDeleteUser,
        permissions, currentUser,
        onSaveRole, onDeleteRole, onUpdateRolePermissions,
    } = props;


    if (!permissions['configuracion.view']) {
        return <Card><CardTitle>Acceso Denegado</CardTitle><p>No tienes permiso para ver esta sección.</p></Card>;
    }
    
     const handleNavClick = (pageId: string) => {
        window.location.hash = pageId;
    };

    return (
        <div className="space-y-8">
            <CompanyInfoSettings 
                info={companyInfo} 
                onSave={onCompanyInfoSave} 
                canEdit={!!permissions['config.company.edit']}
            />
            
            {permissions['config.users.manage'] && (
                <UserManagement
                    users={users}
                    roles={roles}
                    offices={offices}
                    onSaveUser={onSaveUser}
                    onDeleteUser={onDeleteUser}
                    currentUser={currentUser}
                    userPermissions={permissions}
                />
            )}

            {permissions['config.roles.manage'] && (
                <RoleManagement
                    roles={roles}
                    users={users}
                    onSaveRole={onSaveRole}
                    onDeleteRole={onDeleteRole}
                    onUpdateRolePermissions={onUpdateRolePermissions}
                />
            )}

            {permissions['categories.view'] && (
                <Card>
                     <CardHeader>
                         <div className="flex items-center">
                            <SettingsIcon className="w-6 h-6 mr-3 text-primary-500" />
                            <CardTitle>Parámetros Generales</CardTitle>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Configure las opciones fundamentales para el funcionamiento del sistema.
                        </p>
                    </CardHeader>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {CONFIG_SUB_NAV_ITEMS.map(item => {
                            if (!permissions[item.permissionKey]) return null;
                            
                            return (
                                <AccountingTile
                                    key={item.id}
                                    title={item.label}
                                    description={item.description || ''}
                                    icon={item.icon}
                                    onClick={() => handleNavClick(item.id)}
                                    colorVariant={item.colorVariant || 'blue'}
                                />
                            )
                         })}
                     </div>
                </Card>
            )}

        </div>
    );
};

export default ConfiguracionView;
