

import React from 'react';
import { Page, CompanyInfo, User, Permissions } from '../../types';
import { NAV_ITEMS } from '../../constants';
import { MenuIcon, UserIcon, LogOutIcon, SettingsIcon } from '../icons/Icons';
import CurrencyDisplay from '../ui/CurrencyDisplay';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    currentPage: Page;
    onToggleSidebar: () => void;
    companyInfo: CompanyInfo;
    currentUser: User;
    onLogout: () => void;
    permissions: Permissions;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onToggleSidebar, companyInfo, currentUser, onLogout, permissions }) => {
    
    const getPageTitle = () => {
        if (currentPage === 'edit-invoice') return 'Editar Factura';
        if (currentPage === 'report-detail') return 'Detalle de Reporte';
        const navItem = NAV_ITEMS.find(item => item.id === currentPage);
        if (navItem) return navItem.label;
        if (currentPage === 'configuracion') return 'Configuración';
        return 'Inicio';
    }
    const pageTitle = getPageTitle();

    const handleNavClick = (page: Page) => {
        window.location.hash = page;
    };

    return (
        <header className="flex items-center justify-between h-20 px-4 sm:px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="flex items-center">
                {/* Hamburger Menu Button */}
                <button 
                    onClick={onToggleSidebar} 
                    className="lg:hidden mr-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    aria-label="Open sidebar"
                >
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-white truncate">{pageTitle}</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                 <CurrencyDisplay bcvRate={companyInfo.bcvRate} />
                 <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={currentUser.name}>
                        {currentUser.name}
                    </span>
                </div>
                 <ThemeToggle />
                 {permissions['configuracion.view'] && (
                     <a
                        href="#configuracion"
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavClick('configuracion');
                        }}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-white transition-colors"
                        aria-label="Configuración"
                        title="Configuración"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </a>
                 )}
                 <button
                    onClick={onLogout}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-colors"
                    aria-label="Cerrar Sesión"
                    title="Cerrar Sesión"
                >
                    <LogOutIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;