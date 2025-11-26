
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { CompanyInfo, User, Role, Office, Category, ShippingType, PaymentMethod, Permissions, ExpenseCategory, CuentaContable } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { useSystem } from './SystemContext';
import { useAuth } from './AuthContext';
import { apiFetch } from '../utils/api';
import { PLAN_DE_CUENTAS_INICIAL } from '../data/contabilidad';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants';

type ConfigContextType = {
    companyInfo: CompanyInfo;
    categories: Category[];
    users: User[];
    roles: Role[];
    offices: Office[];
    shippingTypes: ShippingType[];
    paymentMethods: PaymentMethod[];
    expenseCategories: ExpenseCategory[];
    cuentasContables: CuentaContable[];
    userPermissions: Permissions;
    isLoading: boolean;
    handleLogin: (username: string, password: string, rememberMe: boolean) => Promise<void>;
    handleLogout: () => Promise<void>;
    handleCompanyInfoSave: (info: CompanyInfo) => Promise<void>;
    handleSaveUser: (user: User) => Promise<void>;
    onDeleteUser: (userId: string) => Promise<void>;
    handleSaveRole: (role: Role) => Promise<void>;
    onDeleteRole: (roleId: string) => Promise<void>;
    onUpdateRolePermissions: (roleId: string, permissions: Permissions) => Promise<void>;
    handleSaveCategory: (category: Category) => Promise<void>;
    onDeleteCategory: (categoryId: string) => Promise<void>;
    handleSaveOffice: (office: Office) => Promise<void>;
    onDeleteOffice: (officeId: string) => Promise<void>;
    handleSaveShippingType: (shippingType: ShippingType) => Promise<void>;
    onDeleteShippingType: (shippingTypeId: string) => Promise<void>;
    handleSavePaymentMethod: (paymentMethod: PaymentMethod) => Promise<void>;
    onDeletePaymentMethod: (paymentMethodId: string) => Promise<void>;
    handleSaveExpenseCategory: (category: ExpenseCategory) => Promise<void>;
    onDeleteExpenseCategory: (categoryId: string) => Promise<void>;
    handleSaveCuentaContable: (cuenta: CuentaContable) => Promise<void>;
    handleDeleteCuentaContable: (cuentaId: string) => Promise<void>;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const FALLBACK_COMPANY_INFO: CompanyInfo = {
    name: 'Sistema de Gestión',
    rif: 'J-000000000',
    address: 'Sin Conexión al Servidor',
    phone: '',
    loginImageUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb122c2a6?q=80&w=2070&auto=format&fit=crop'
};

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { addToast } = useToast();
    const { logAction } = useSystem();
    const { isAuthenticated, currentUser, setIsAuthenticated, setCurrentUser } = useAuth();

    // Initial state with a loading placeholder
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ name: 'Cargando...', rif: '', address: '', phone: '' });
    const [categories, setCategories] = useState<Category[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [offices, setOffices] = useState<Office[]>([]);
    const [shippingTypes, setShippingTypes] = useState<ShippingType[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]);
    const [userPermissions, setUserPermissions] = useState<Permissions>({});
    const [isLoading, setIsLoading] = useState(true);

    // Helper function to safely fetch data that might be restricted (403) or missing (404)
    const fetchSafe = async <T,>(endpoint: string, fallbackValue: T): Promise<T> => {
        try {
            return await apiFetch<T>(endpoint);
        } catch (error: any) {
            // Check for permission errors specifically to avoid noise in console
            if (error.message && (
                error.message.includes('403') ||
                error.message.includes('401') ||
                error.message.includes('404') ||
                error.message.includes('No tiene los permisos') // Backend specific message
            )) {
                // Silent fail for permissions/not found, just use fallback
                return fallbackValue;
            }
            // If it's a network error or 500, we might want to let it propagate or just log it
            console.warn(`Error fetching ${endpoint}:`, error.message);
            return fallbackValue;
        }
    };

    useEffect(() => {
        const fetchConfigData = async () => {
            if (isAuthenticated && currentUser) {
                try {
                    setIsLoading(true);
                    
                    const isAdmin = currentUser.roleId === 'role-admin';
                    const isTech = currentUser.roleId === 'role-tech';
                    const hasFullAccess = isAdmin || isTech;

                    // Group 1: Public/Essential Data (Should generally succeed for all users)
                    const [
                        categoriesData, 
                        officesData, 
                        shippingTypesData, 
                        paymentMethodsData
                    ] = await Promise.all([
                        apiFetch<Category[]>('/categories'),
                        apiFetch<Office[]>('/offices'),
                        apiFetch<ShippingType[]>('/shipping-types'),
                        apiFetch<PaymentMethod[]>('/payment-methods'),
                    ]);

                    setCategories(categoriesData);
                    setOffices(officesData);
                    setShippingTypes(shippingTypesData);
                    setPaymentMethods(paymentMethodsData);

                    // Group 2: Restricted/Admin Data
                    // We ONLY fetch these if the user is Admin or Tech to avoid 403 errors from backend
                    let usersData: User[] = [];
                    let rolesData: Role[] = [];
                    let expenseCategoriesData: ExpenseCategory[] = [];
                    let cuentasData: CuentaContable[] = [];

                    if (hasFullAccess) {
                        [
                            usersData, 
                            rolesData, 
                            expenseCategoriesData,
                            cuentasData
                        ] = await Promise.all([
                            fetchSafe<User[]>('/users', []),
                            fetchSafe<Role[]>('/roles', []),
                            fetchSafe<ExpenseCategory[]>('/expense-categories', []),
                            fetchSafe<CuentaContable[]>('/cuentas-contables', [])
                        ]);
                    }

                    setUsers(usersData);
                    setRoles(rolesData);
                    setExpenseCategories(expenseCategoriesData);
                    
                    if (hasFullAccess && cuentasData && cuentasData.length > 0) {
                        setCuentasContables(cuentasData);
                    } else if (hasFullAccess) {
                        // Only fallback to initial plan if we actually tried and got nothing/error
                        setCuentasContables(PLAN_DE_CUENTAS_INICIAL);
                    } else {
                        setCuentasContables([]);
                    }

                } catch (error: any) {
                    addToast({ type: 'error', title: 'Error de Carga Parcial', message: `Algunos datos de configuración no se pudieron cargar: ${error.message}` });
                } finally {
                    setIsLoading(false);
                }
            } else if (!isAuthenticated) {
                 try {
                     const companyData = await apiFetch<CompanyInfo>('/company-info');
                     setCompanyInfo(companyData);
                 } catch (error: any) {
                    console.warn("Modo Offline: No se pudo conectar con el servidor de configuración.", error);
                    setCompanyInfo(FALLBACK_COMPANY_INFO);
                 } finally {
                     setIsLoading(false);
                 }
            }
        };
        fetchConfigData();
    }, [isAuthenticated, currentUser, addToast]);

     useEffect(() => {
        if (isAuthenticated) {
            apiFetch<CompanyInfo>('/company-info')
                .then(data => setCompanyInfo(data))
                .catch(err => console.warn("Background fetch company info failed", err));
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Logic to set permissions based on the loaded role OR fallback to defaults
        if (currentUser) {
            // 1. Try to find the role in the fetched 'roles' list (likely only works for Admins)
            const fetchedRole = roles.find(r => r.id === currentUser.roleId);
            
            if (fetchedRole) {
                setUserPermissions(fetchedRole.permissions);
            } else {
                // 2. If not found (e.g., Operator who got 403 on /roles), use hardcoded defaults
                const defaultPerms = DEFAULT_ROLE_PERMISSIONS[currentUser.roleId];
                if (defaultPerms) {
                    setUserPermissions(defaultPerms);
                } else {
                    // 3. If unknown role ID, default to empty (secure closed)
                    console.warn(`Unknown role ID: ${currentUser.roleId}. No permissions assigned.`);
                    setUserPermissions({});
                }
            }
        } else {
            setUserPermissions({});
        }
    }, [currentUser, roles]);

    useEffect(() => {
        document.title = companyInfo.name || 'Facturación';
    }, [companyInfo]);

    const handleLogin = async (username: string, password: string, rememberMe: boolean) => {
        try {
            const { user, accessToken, refreshToken } = await apiFetch<{ user: User; accessToken: string; refreshToken: string; }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
    
            if (user && accessToken && refreshToken) {
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
    
                if (rememberMe) localStorage.setItem('rememberedUser', user.username);
                else localStorage.removeItem('rememberedUser');
                
                setCurrentUser(user);
                setIsAuthenticated(true);
                window.location.hash = 'dashboard';
                addToast({ type: 'success', title: '¡Bienvenido!', message: `Ha iniciado sesión como ${user.name}.` });
                logAction(user, 'INICIO_SESION', `El usuario '${user.name}' inició sesión.`);
            } else { throw new Error('Respuesta de autenticación inválida'); }
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error de Autenticación', message: error.message || 'Usuario o contraseña incorrectos o servidor no disponible.' });
        }
    };
    
    const handleLogout = async () => {
        try {
            if (currentUser) {
                logAction(currentUser, 'CIERRE_SESION', `El usuario '${currentUser.name}' cerró sesión.`);
            }
            await apiFetch('/auth/logout', { method: 'POST' });
            addToast({ type: 'info', title: 'Sesión Cerrada', message: 'Ha cerrado sesión exitosamente.' });
        } catch (error: any) {
            console.error('Logout failed:', error);
            addToast({ type: 'error', title: 'Error al cerrar sesión', message: 'No se pudo contactar al servidor, pero se ha cerrado la sesión localmente.' });
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            setCurrentUser(null);
            window.location.hash = '';
        }
    };

    const handleCompanyInfoSave = async (info: CompanyInfo) => {
        try {
            const updatedInfo = await apiFetch<CompanyInfo>('/company-info', {
                method: 'PUT',
                body: JSON.stringify(info)
            });
            setCompanyInfo(updatedInfo);
            addToast({ type: 'success', title: 'Configuración Guardada', message: 'La información de la empresa ha sido actualizada.' });
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error al Guardar', message: error.message });
        }
    };

    const handleSaveUser = async (user: User) => {
        if (!currentUser) return;
        try {
            const isUpdating = !!user.id;
            const endpoint = isUpdating ? `/users/${user.id}` : '/users';
            const method = isUpdating ? 'PUT' : 'POST';

            const userToSend = { ...user };
            if (!isUpdating) {
                delete (userToSend as Partial<User>).id;
            }
            if (isUpdating && userToSend.password === '') {
                delete userToSend.password;
            }

            const savedUser = await apiFetch<User>(endpoint, {
                method,
                body: JSON.stringify(userToSend),
            });

            if (isUpdating) {
                setUsers(users.map(u => u.id === savedUser.id ? savedUser : u));
                if (currentUser.id === savedUser.id) {
                    setCurrentUser(savedUser);
                }
            } else {
                setUsers([...users, savedUser]);
            }
            logAction(currentUser, isUpdating ? 'ACTUALIZAR_USUARIO' : 'CREAR_USUARIO', `Guardó al usuario ${savedUser.name}.`, savedUser.id);
            addToast({ type: 'success', title: 'Usuario Guardado', message: `El usuario ${savedUser.name} ha sido guardado.` });
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error al Guardar Usuario', message: error.message });
        }
    };

    const onDeleteUser = async (userId: string) => {
        if (!currentUser) return;
        try {
            const userName = users.find(u => u.id === userId)?.name;
            await apiFetch(`/users/${userId}`, { method: 'DELETE' });
            setUsers(users.filter(u => u.id !== userId));
            logAction(currentUser, 'ELIMINAR_USUARIO', `Eliminó al usuario ${userName}.`, userId);
            addToast({ type: 'success', title: 'Usuario Eliminado', message: 'El usuario ha sido eliminado.' });
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error al Eliminar', message: error.message });
        }
    };
    
    const handleGenericSave = async <T extends { id?: string }>(item: T, endpoint: string, stateSetter: React.Dispatch<React.SetStateAction<T[]>>, itemType: string) => {
        const isUpdating = !!item.id;
        const url = isUpdating ? `${endpoint}/${item.id}` : endpoint;
        const method = isUpdating ? 'PUT' : 'POST';

        const bodyToSend = { ...item };
        if (!isUpdating) {
            delete (bodyToSend as Partial<T>).id;
        }

        try {
            const savedItem = await apiFetch<T>(url, {
                method,
                body: JSON.stringify(bodyToSend),
            });
            stateSetter(prev => isUpdating ? prev.map(i => (i as any).id === (savedItem as any).id ? savedItem : i) : [...prev, savedItem]);
            addToast({ type: 'success', title: `${itemType} Guardado`, message: `'${(item as any).name || (item as any).nombre}' se ha guardado.` });
        } catch (error: any) { addToast({ type: 'error', title: `Error al Guardar ${itemType}`, message: error.message }); }
    };
    
    const handleGenericDelete = async (id: string, endpoint: string, stateSetter: React.Dispatch<React.SetStateAction<any[]>>, itemType: string) => {
        try {
            await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
            stateSetter(prev => prev.filter(item => item.id !== id));
            addToast({ type: 'success', title: `${itemType} Eliminado`, message: `El elemento ha sido eliminado.` });
        } catch (error: any) { addToast({ type: 'error', title: `Error al Eliminar ${itemType}`, message: error.message }); }
    };

    const handleSaveRole = async (role: Role) => { await handleGenericSave(role, '/roles', setRoles, 'Rol'); };
    const onDeleteRole = async (roleId: string) => { await handleGenericDelete(roleId, '/roles', setRoles, 'Rol'); };
    const onUpdateRolePermissions = async (roleId: string, permissions: Permissions) => {
        try {
            const updatedRole = await apiFetch<Role>(`/roles/${roleId}/permissions`, {
                method: 'PUT',
                body: JSON.stringify({ permissions }),
            });
            setRoles(roles.map(r => r.id === roleId ? updatedRole : r));
            addToast({ type: 'success', title: 'Permisos Actualizados', message: 'Los permisos del rol han sido actualizados.' });
        } catch (error: any) { addToast({ type: 'error', title: `Error al Guardar Permisos`, message: error.message }); }
    };

    const handleSaveCategory = async (category: Category) => { await handleGenericSave(category, '/categories', setCategories, 'Categoría'); };
    const onDeleteCategory = async (id: string) => { await handleGenericDelete(id, '/categories', setCategories, 'Categoría'); };
    const handleSaveOffice = async (office: Office) => { await handleGenericSave(office, '/offices', setOffices, 'Oficina'); };
    const onDeleteOffice = async (id: string) => { await handleGenericDelete(id, '/offices', setOffices, 'Oficina'); };
    const handleSaveShippingType = async (st: ShippingType) => { await handleGenericSave(st, '/shipping-types', setShippingTypes, 'Tipo de Envío'); };
    const onDeleteShippingType = async (id: string) => { await handleGenericDelete(id, '/shipping-types', setShippingTypes, 'Tipo de Envío'); };
    const handleSavePaymentMethod = async (pm: PaymentMethod) => { await handleGenericSave(pm, '/payment-methods', setPaymentMethods, 'Forma de Pago'); };
    const onDeletePaymentMethod = async (id: string) => { await handleGenericDelete(id, '/payment-methods', setPaymentMethods, 'Forma de Pago'); };
    const handleSaveExpenseCategory = async (cat: ExpenseCategory) => { await handleGenericSave(cat, '/expense-categories', setExpenseCategories, 'Categoría de Gasto'); };
    const onDeleteExpenseCategory = async (id: string) => { await handleGenericDelete(id, '/expense-categories', setExpenseCategories, 'Categoría de Gasto'); };
    const handleSaveCuentaContable = async (cuenta: CuentaContable) => { await handleGenericSave(cuenta, '/cuentas-contables', setCuentasContables, 'Cuenta Contable'); };
    const handleDeleteCuentaContable = async (id: string) => { await handleGenericDelete(id, '/cuentas-contables', setCuentasContables, 'Cuenta Contable'); };

    const value: ConfigContextType = {
        companyInfo, categories, users, roles, offices, shippingTypes, paymentMethods, 
        expenseCategories, cuentasContables, userPermissions, isLoading, handleLogin, handleLogout, handleCompanyInfoSave, 
        handleSaveUser, onDeleteUser, handleSaveRole, onDeleteRole, onUpdateRolePermissions, 
        handleSaveCategory, onDeleteCategory, handleSaveOffice, onDeleteOffice, 
        handleSaveShippingType, onDeleteShippingType, handleSavePaymentMethod, 
        onDeletePaymentMethod, handleSaveExpenseCategory, onDeleteExpenseCategory,
        handleSaveCuentaContable, handleDeleteCuentaContable
    };

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
    const context = useContext(ConfigContext);
    if (!context) throw new Error('useConfig must be used within a ConfigProvider');
    return context;
};
