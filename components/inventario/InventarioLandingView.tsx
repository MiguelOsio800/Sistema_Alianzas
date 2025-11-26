



import React from 'react';
import AccountingTile from '../libro-contable/AccountingTile';
import { ArchiveBoxIcon, BuildingOfficeIcon, TagIcon } from '../icons/Icons';
import { Permissions } from '../../types';

interface InventarioLandingViewProps {
    permissions: Permissions;
}

const InventarioLandingView: React.FC<InventarioLandingViewProps> = ({ permissions }) => {
    
    if (!permissions['inventario.view']) {
        return null; // Should be handled by router, but as a fallback.
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Módulos de Inventario</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {permissions['inventario-envios.view'] && (
                    <AccountingTile
                        title="Inventario de Envíos"
                        description="Cargas y paquetes generados desde las facturas."
                        icon={ArchiveBoxIcon}
                        onClick={() => window.location.hash = 'inventario-envios'}
                        colorVariant="blue"
                    />
                )}
                {permissions['inventario-bienes.view'] && (
                    <AccountingTile
                        title="Inventario de Bienes"
                        description="Activos fijos y bienes de la empresa."
                        icon={BuildingOfficeIcon}
                        onClick={() => window.location.hash = 'inventario-bienes'}
                        colorVariant="green"
                    />
                )}
                {permissions['bienes-categorias.view'] && (
                    <div className="md:col-span-2">
                        <AccountingTile
                            title="Categorías de Bienes"
                            description="Gestionar las clasificaciones de los bienes de la empresa."
                            icon={TagIcon}
                            onClick={() => window.location.hash = 'bienes-categorias'}
                            colorVariant="orange"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventarioLandingView;
