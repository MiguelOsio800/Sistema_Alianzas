import React, { useEffect, useRef } from 'react';
import { NAV_ITEMS } from '../../constants';
import { Page, Permissions, CompanyInfo } from '../../types';
import { PackageIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '../icons/Icons';

interface SidebarProps {
    currentPage: Page;
    permissions: Permissions;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    companyInfo: CompanyInfo;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, permissions, isSidebarOpen, setIsSidebarOpen, companyInfo, isSidebarCollapsed, setIsSidebarCollapsed }) => {
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Close sidebar on link click on mobile
    const handleNavClick = (page: Page) => {
        window.location.hash = page;
        if (window.innerWidth < 1024) { // lg breakpoint
            setIsSidebarOpen(false);
        }
    };

    // Close sidebar on outside click on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                if (isSidebarOpen && window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen, setIsSidebarOpen]);


    const visibleNavItems = NAV_ITEMS.filter(item => {
       const key = item.permissionKey;
       return permissions[key];
    });

    return (
        <>
            {/* Backdrop for mobile */}
            <div 
                className={`fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>

            <div
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 flex flex-col transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
                } ${
                    isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
                }`}
            >
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-700 shrink-0 px-4">
                    {isSidebarCollapsed ? (
                         <PackageIcon className="h-10 w-10 text-primary-600" />
                    ) : (
                        companyInfo.logoUrl ? (
                            <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="h-12 object-contain" />
                        ) : (
                            <PackageIcon className="h-10 w-10 text-primary-600" />
                        )
                    )}
                </div>
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {visibleNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id || (item.id !== 'dashboard' && currentPage.startsWith(item.id));
                        
                        return (
                            <a
                                key={item.id}
                                href={`#${item.id}`}
                                title={isSidebarCollapsed ? item.label : ''}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavClick(item.id);
                                }}
                                className={`flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                                    isActive
                                        ? 'bg-primary-500 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                } ${
                                    isSidebarCollapsed ? 'justify-center px-2' : 'px-4'
                                }`}
                            >
                                <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${!isSidebarCollapsed && 'mr-3'}`} />
                                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                            </a>
                        );
                    })}
                </nav>
                 {/* Collapse Button */}
                <div className="hidden lg:block px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`w-full flex items-center p-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        title={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                    >
                        {isSidebarCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
                        {!isSidebarCollapsed && <span className="ml-3">Deslizar</span>}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;