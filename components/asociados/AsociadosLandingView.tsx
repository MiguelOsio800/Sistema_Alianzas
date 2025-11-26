import React, { useState } from 'react';
import { Permissions } from '../../types';
import AccountingTile from '../libro-contable/AccountingTile';
import { UsersIcon, BarChartIcon, FileTextIcon, CreditCardIcon } from '../icons/Icons';

interface AsociadosLandingViewProps {
    permissions: Permissions;
}

const AsociadosLandingView: React.FC<AsociadosLandingViewProps> = ({ permissions }) => {
    
    if (!permissions['asociados.view']) {
        return null; 
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">Módulo de Asociados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {permissions['asociados.view'] && (
                    <AccountingTile
                        title="Gestión de Asociados"
                        description="Crear, buscar y actualizar datos de asociados y vehículos."
                        icon={UsersIcon}
                        onClick={() => window.location.hash = 'asociados/gestion'}
                        colorVariant="blue"
                    />
                )}
                {permissions['asociados.view'] && (
                    <AccountingTile
                        title="Pagos de Asociados"
                        description="Registrar abonos, generar recibos y gestionar deudas."
                        icon={CreditCardIcon}
                        onClick={() => window.location.hash = 'asociados/pagos'}
                        colorVariant="orange"
                    />
                )}
                {permissions['asociados.view'] && (
                     <AccountingTile
                        title="Estadísticas de Pagos"
                        description="Ver reporte de asociados solventes y con deudas."
                        icon={BarChartIcon}
                        onClick={() => window.location.hash = 'asociados/estadisticas'}
                        colorVariant="green"
                    />
                )}
                 {permissions['asociados.view'] && (
                    <AccountingTile
                        title="Reportes de Asociados"
                        description="Generar estado de cuenta y otros reportes detallados."
                        icon={FileTextIcon}
                        onClick={() => window.location.hash = 'asociados/reportes'}
                        colorVariant="purple"
                    />
                )}
            </div>
        </div>
    );
};

export default AsociadosLandingView;