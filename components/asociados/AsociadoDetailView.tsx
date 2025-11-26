
import React, { useState } from 'react';
import { Asociado, Vehicle, Certificado, Permissions } from '../../types';
import Button from '../ui/Button';
import { ArrowLeftIcon } from '../icons/Icons';
import DatosSocioTab from './DatosSocioTab';
import CertificadoVehiculoTab from './CertificadoVehiculoTab';

interface AsociadoDetailViewProps {
    asociado: Asociado;
    onBack: () => void;
    onSaveAsociado: (asociado: Asociado) => Promise<void>;

    vehicles: Vehicle[];
    onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
    onDeleteVehicle: (vehicleId: string) => Promise<void>;
    
    certificados: Certificado[];
    onSaveCertificado: (certificado: Certificado) => Promise<void>;
    onDeleteCertificado: (certificadoId: string) => Promise<void>;

    permissions: Permissions;
}

type Tab = 'datos' | 'vehiculos';

const AsociadoDetailView: React.FC<AsociadoDetailViewProps> = (props) => {
    const { asociado, onBack } = props;
    const [activeTab, setActiveTab] = useState<Tab>('datos');
    const [currentAsociado, setCurrentAsociado] = useState(asociado);

    const handleSaveAsociado = async (updatedAsociado: Asociado) => {
        await props.onSaveAsociado(updatedAsociado);
        setCurrentAsociado(updatedAsociado);
    };

    const TabButton: React.FC<{ tabId: Tab, label: string }> = ({ tabId, label }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                activeTab === tabId
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <Button variant="secondary" onClick={onBack}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Volver a la Búsqueda
                    </Button>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        {currentAsociado.id ? `${currentAsociado.nombre}` : 'Nuevo Asociado'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Código: {currentAsociado.codigo || 'N/A'}
                    </p>
                </div>
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-2" aria-label="Tabs">
                    <TabButton tabId="datos" label="Datos del Socio" />
                    <TabButton tabId="vehiculos" label="Vehículos y Certificados" />
                </nav>
            </div>
            
            <div className="mt-4">
                {activeTab === 'datos' && <DatosSocioTab asociado={currentAsociado} onSave={handleSaveAsociado} />}
                {activeTab === 'vehiculos' && <CertificadoVehiculoTab 
                    asociadoId={currentAsociado.id}
                    vehicles={props.vehicles}
                    onSaveVehicle={props.onSaveVehicle}
                    onDeleteVehicle={props.onDeleteVehicle}
                    certificados={props.certificados}
                    onSaveCertificado={props.onSaveCertificado}
                    onDeleteCertificado={props.onDeleteCertificado}
                />}
            </div>
        </div>
    );
};

export default AsociadoDetailView;
