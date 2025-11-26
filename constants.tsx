
import React from 'react';
import { Page, Report } from './types';
import { HomeIcon, FilePlusIcon, TruckIcon, BarChartIcon, SettingsIcon, ReceiptIcon, TagIcon, UsersIcon, BuildingOfficeIcon, ListBulletIcon, CreditCardIcon, BookOpenIcon, ArchiveBoxIcon, ShieldCheckIcon, WrenchScrewdriverIcon, BriefcaseIcon, ClipboardDocumentListIcon } from './components/icons/Icons';

interface NavItem {
    id: Page;
    label: string;
    icon: React.ElementType;
    permissionKey: string; 
    description?: string;
    colorVariant?: 'blue' | 'green' | 'purple' | 'orange';
}

export const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Inicio', icon: HomeIcon, permissionKey: 'dashboard.view' },
    { id: 'shipping-guide', label: 'Crear Factura', icon: FilePlusIcon, permissionKey: 'shipping-guide.view' },
    { id: 'invoices', label: 'Facturas', icon: ReceiptIcon, permissionKey: 'invoices.view' },
    { id: 'flota', label: 'Flota', icon: TruckIcon, permissionKey: 'flota.view' },
    { id: 'remesas', label: 'Remesas', icon: ClipboardDocumentListIcon, permissionKey: 'remesas.view' },
    { id: 'asociados', label: 'Asociados', icon: UsersIcon, permissionKey: 'asociados.view' },
    { id: 'clientes', label: 'Clientes', icon: UsersIcon, permissionKey: 'clientes.view' },
    { id: 'proveedores', label: 'Proveedores', icon: BriefcaseIcon, permissionKey: 'proveedores.view' },
    { id: 'libro-contable', label: 'Libro Contable', icon: BookOpenIcon, permissionKey: 'libro-contable.view' },
    { id: 'inventario', label: 'Inventario', icon: ArchiveBoxIcon, permissionKey: 'inventario.view' },
    { id: 'reports', label: 'Reportes', icon: BarChartIcon, permissionKey: 'reports.view' },
    { id: 'auditoria', label: 'Auditoría', icon: ShieldCheckIcon, permissionKey: 'auditoria.view' },
];

export const CONFIG_SUB_NAV_ITEMS: NavItem[] = [
    { 
        id: 'categories', 
        label: 'Categorías de Mercancía', 
        icon: TagIcon, 
        permissionKey: 'categories.view',
        description: 'Define los tipos de mercancía que se transportan.',
        colorVariant: 'orange'
    },
    { 
        id: 'offices', 
        label: 'Oficinas y Sucursales', 
        icon: BuildingOfficeIcon, 
        permissionKey: 'offices.view',
        description: 'Gestiona las sucursales y puntos de operación.',
        colorVariant: 'blue'
    },
    { 
        id: 'shipping-types', 
        label: 'Tipos de Envío', 
        icon: ListBulletIcon, 
        permissionKey: 'shipping-types.view',
        description: 'Configura las modalidades de envío disponibles.',
        colorVariant: 'purple'
    },
    { 
        id: 'payment-methods', 
        label: 'Formas de Pago', 
        icon: CreditCardIcon, 
        permissionKey: 'payment-methods.view',
        description: 'Administra cuentas bancarias y métodos de pago.',
        colorVariant: 'green'
    },
];


export const SYSTEM_REPORTS: Report[] = [
    { id: 'general_envios', title: 'Reporte General de Envíos' },
    { id: 'libro_venta', title: 'Reporte de Libro de Venta' },
    { id: 'cuentas_cobrar', title: 'Reporte de Cuentas por Cobrar' },
    { id: 'cuentas_pagar', title: 'Reporte de Cuentas por Pagar (Gastos)' },
    { id: 'ipostel', title: 'Reporte de Aporte IPOSTEL' },
    { id: 'seguro', title: 'Reporte de Cobro de Seguro' },
    { id: 'clientes', title: 'Reporte de Movimiento de Clientes' },
    { id: 'envios_oficina', title: 'Reporte de Productividad por Oficina' },
    { id: 'gastos_oficina', title: 'Reporte de Gastos por Oficina' },
    { id: 'facturas_anuladas', title: 'Reporte de Facturas Anuladas' },
    { id: 'iva', title: 'Reporte de I.V.A. (Débito y Crédito Fiscal)' },
    { id: 'cuadre_caja', title: 'Reporte de Cuadre de Caja' },
    { id: 'reporte_kilogramos', title: 'Reporte de Kilogramos Movilizados' },
    { id: 'reporte_envios_vehiculo', title: 'Reporte de Envíos por Vehículo' },
];

export const OFFICES: string[] = ['Caracas - San Agustín', 'Valencia - San Blas', 'Barquisimeto - Centro'];

export const ALL_PERMISSION_KEYS: string[] = [
    // Dashboard
    'dashboard.view',
    // Shipping Guide
    'shipping-guide.view',
    // Invoices
    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.void', 'invoices.changeStatus',
    // Flota
    'flota.view', 'flota.create', 'flota.edit', 'flota.delete', 'flota.dispatch',
    // Remesas
    'remesas.view', 'remesas.create', 'remesas.delete',
    // Asociados
    'asociados.view', 'asociados.create', 'asociados.edit', 'asociados.delete', 'asociados.pagos.delete',
    // Clientes
    'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete',
    // Proveedores
    'proveedores.view', 'proveedores.create', 'proveedores.edit', 'proveedores.delete',
    // Libro Contable
    'libro-contable.view', 'libro-contable.create', 'libro-contable.edit', 'libro-contable.delete',
    'plan-contable.view', 'plan-contable.create', 'plan-contable.edit', 'plan-contable.delete',
    // Inventario
    'inventario.view',
    'inventario-envios.view',
    'inventario-bienes.view', 'inventario-bienes.create', 'inventario-bienes.edit', 'inventario-bienes.delete',
    'bienes-categorias.view', 'bienes-categorias.create', 'bienes-categorias.edit', 'bienes-categorias.delete',
    // Reports
    'reports.view',
    // Auditoria
    'auditoria.view',
    // Configuracion
    'configuracion.view',
    'config.company.edit',
    'config.users.manage', 'config.users.edit_protected', 'config.users.manage_tech_users',
    'config.roles.manage',
    // Config sub-modules
    'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
    'offices.view', 'offices.create', 'offices.edit', 'offices.delete',
    'shipping-types.view', 'shipping-types.create', 'shipping-types.edit', 'shipping-types.delete',
    'payment-methods.view', 'payment-methods.create', 'payment-methods.edit', 'payment-methods.delete',
];

export const PERMISSION_KEY_TRANSLATIONS: Record<string, string> = {
    // Dashboard
    'dashboard.view': 'Ver Inicio',
    // Shipping Guide
    'shipping-guide.view': 'Crear Guías/Facturas',
    // Invoices
    'invoices.view': 'Ver Facturas',
    'invoices.create': 'Crear Facturas',
    'invoices.edit': 'Editar Facturas',
    'invoices.delete': 'Eliminar Facturas (Permanente)',
    'invoices.void': 'Anular Facturas',
    'invoices.changeStatus': 'Cambiar Estado de Facturas',
    // Flota
    'flota.view': 'Ver Módulo de Flota',
    'flota.create': 'Añadir Vehículos a Flota',
    'flota.edit': 'Editar Vehículos de Flota',
    'flota.delete': 'Eliminar Vehículos de Flota',
    'flota.dispatch': 'Despachar y Finalizar Viajes',
    // Remesas
    'remesas.view': 'Ver Módulo de Remesas',
    'remesas.create': 'Crear Remesas',
    'remesas.delete': 'Eliminar Remesas',
    // Asociados
    'asociados.view': 'Ver Módulo de Asociados',
    'asociados.create': 'Crear Asociados',
    'asociados.edit': 'Editar Asociados',
    'asociados.delete': 'Eliminar Asociados',
    'asociados.pagos.delete': 'Eliminar Deudas de Asociados',
    // Clientes
    'clientes.view': 'Ver Clientes',
    'clientes.create': 'Crear Clientes',
    'clientes.edit': 'Editar Clientes',
    'clientes.delete': 'Eliminar Clientes',
    // Proveedores
    'proveedores.view': 'Ver Proveedores',
    'proveedores.create': 'Crear Proveedores',
    'proveedores.edit': 'Editar Proveedores',
    'proveedores.delete': 'Eliminar Proveedores',
    // Libro Contable
    'libro-contable.view': 'Ver Libro Contable',
    'libro-contable.create': 'Registrar Gastos',
    'libro-contable.edit': 'Editar Gastos',
    'libro-contable.delete': 'Eliminar Gastos',
    'plan-contable.view': 'Ver Plan de Cuentas',
    'plan-contable.create': 'Crear Cuentas Contables',
    'plan-contable.edit': 'Editar Cuentas Contables',
    'plan-contable.delete': 'Eliminar Cuentas Contables',
    // Inventario
    'inventario.view': 'Ver Módulo de Inventario',
    'inventario-envios.view': 'Ver Inventario de Envíos',
    'inventario-bienes.view': 'Ver Inventario de Bienes',
    'inventario-bienes.create': 'Crear Bienes',
    'inventario-bienes.edit': 'Editar Bienes',
    'inventario-bienes.delete': 'Eliminar Bienes',
    'bienes-categorias.view': 'Ver Categorías de Bienes',
    'bienes-categorias.create': 'Crear Categorías de Bienes',
    'bienes-categorias.edit': 'Editar Categorías de Bienes',
    'bienes-categorias.delete': 'Eliminar Categorías de Bienes',
    // Reports
    'reports.view': 'Ver Reportes',
    // Auditoria
    'auditoria.view': 'Ver Auditoría',
    // Configuracion
    'configuracion.view': 'Ver Configuración',
    'config.company.edit': 'Editar Datos de la Empresa',
    'config.users.manage': 'Gestionar Usuarios',
    'config.users.edit_protected': 'Editar Usuarios Protegidos',
    'config.users.manage_tech_users': 'Gestionar Usuarios de Soporte',
    'config.roles.manage': 'Gestionar Roles y Permisos',
    // Config sub-modules
    'categories.view': 'Ver Categorías de Mercancía',
    'categories.create': 'Crear Categorías de Mercancía',
    'categories.edit': 'Editar Categorías de Mercancía',
    'categories.delete': 'Eliminar Categorías de Mercancía',
    'offices.view': 'Ver Oficinas',
    'offices.create': 'Crear Oficinas',
    'offices.edit': 'Editar Oficinas',
    'offices.delete': 'Eliminar Oficinas',
    'shipping-types.view': 'Ver Tipos de Envío',
    'shipping-types.create': 'Crear Tipos de Envío',
    'shipping-types.edit': 'Editar Tipos de Envío',
    'shipping-types.delete': 'Eliminar Tipos de Envío',
    'payment-methods.view': 'Ver Formas de Pago',
    'payment-methods.create': 'Crear Formas de Pago',
    'payment-methods.edit': 'Editar Formas de Pago',
    'payment-methods.delete': 'Eliminar Formas de Pago',
};

// Default permissions for standard roles to use as fallback if API fetching fails (e.g. 403)
const operatorPermissions: Record<string, boolean> = {
    'dashboard.view': true,
    'shipping-guide.view': true,
    'invoices.view': true, 'invoices.create': true, 'invoices.edit': true, 'invoices.changeStatus': true,
    'flota.view': true,
    'remesas.view': true,
    'asociados.view': true, // Enabled to allow data fetching for Fleet module, hidden via Sidebar logic
    'clientes.view': true, 'clientes.create': true, 'clientes.edit': true,
    'proveedores.view': false, 
    // Typically operators can view expenses but maybe not manage all aspects, depends on business logic
    // 'libro-contable.view': true, 
    'inventario.view': true,
    'inventario-envios.view': true,
    'inventario-bienes.view': true,
    'bienes-categorias.view': true,
    'reports.view': true,
    'configuracion.view': false, 
    'categories.view': true, 'offices.view': true, 'shipping-types.view': true, 'payment-methods.view': true
};

const adminPermissions: Record<string, boolean> = ALL_PERMISSION_KEYS.reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>);
adminPermissions['config.users.edit_protected'] = false;
adminPermissions['config.users.manage_tech_users'] = false;

const techPermissions: Record<string, boolean> = ALL_PERMISSION_KEYS.reduce((acc, key) => { acc[key] = true; return acc; }, {} as Record<string, boolean>);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
    'role-admin': adminPermissions,
    'role-op': operatorPermissions,
    'role-tech': techPermissions,
};
