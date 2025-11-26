import React from 'react';
import { Asociado, Vehicle } from '../../types';
import Card, { CardTitle } from '../ui/Card';
import { UserIcon, TruckIcon } from '../icons/Icons';

interface FlotaViewProps {
    asociados: Asociado[];
    vehicles: Vehicle[];
}

const AsociadoCard: React.FC<{ asociado: Asociado, vehicleCount: number }> = ({ asociado, vehicleCount }) => {
    const handleSelect = () => {
        window.location.hash = `flota-vehiculos/${asociado.id}`;
    };

    return (
        <button
            onClick={handleSelect}
            className="w-full text-left p-6 bg-white dark:bg-gray-800/50 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                    <UserIcon className="w-8 h-8 text-primary-600 dark:text-primary-300" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{asociado.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Código: {asociado.codigo}</p>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Vehículos Registrados:</span>
                <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                    <TruckIcon className="w-5 h-5 text-primary-500" />
                    <span>{vehicleCount}</span>
                </div>
            </div>
        </button>
    );
};

const FlotaView: React.FC<FlotaViewProps> = ({ asociados, vehicles }) => {
    return (
        <Card>
            <CardTitle>Seleccionar Asociado</CardTitle>
            <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Elija un asociado para ver y gestionar su flota de vehículos.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {asociados.map(asociado => {
                    const vehicleCount = vehicles.filter(v => v.asociadoId === asociado.id).length;
                    return (
                        <AsociadoCard key={asociado.id} asociado={asociado} vehicleCount={vehicleCount} />
                    );
                })}
            </div>
             {asociados.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>No hay asociados registrados en el sistema.</p>
                    <p className="text-sm mt-1">Vaya a la sección de 'Asociados' para añadir uno nuevo.</p>
                </div>
            )}
        </Card>
    );
};

export default FlotaView;