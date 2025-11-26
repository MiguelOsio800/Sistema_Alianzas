import React, { useState, useMemo } from 'react';
import { Invoice, Vehicle, Permissions, Office, CompanyInfo, Client, Asociado } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { TruckIcon, EditIcon, TrashIcon, ClipboardDocumentListIcon, XIcon, FileTextIcon, ArrowLeftIcon } from '../icons/Icons';
import VehicleFormModal from './VehicleFormModal';
import VehicleShipmentManifest from './VehicleShipmentManifest';
import { calculateInvoiceChargeableWeight } from '../../utils/financials';

interface FlotaVehiculosPorAsociadoViewProps {
    asociado: Asociado;
    vehicles: Vehicle[];
    invoices: Invoice[];
    offices: Office[];
    clients: Client[];
    onUnassignInvoice: (invoiceId: string) => Promise<void>;
    onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
    onDeleteVehicle: (vehicleId: string) => Promise<void>;
    onFinalizeTrip: (vehicleId: string) => Promise<void>;
    onUndoDispatch: (vehicleId: string) => Promise<void>;
    permissions: Permissions;
    companyInfo: CompanyInfo;
}

const statusInfo: { [key in Vehicle['status']]: { color: string, text: string } } = {
    Disponible: { color: 'bg-green-500', text: 'Disponible' },
    'En Ruta': { color: 'bg-blue-500', text: 'En Ruta' },
    'En Mantenimiento': { color: 'bg-yellow-500', text: 'Mantenimiento' },
};


const FlotaVehiculosPorAsociadoView: React.FC<FlotaVehiculosPorAsociadoViewProps> = (props) => {
    const { 
        asociado, vehicles, invoices, offices, clients, 
        onUnassignInvoice, onSaveVehicle, onDeleteVehicle, 
        onFinalizeTrip, onUndoDispatch,
        permissions, companyInfo 
    } = props;
    
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    
    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
    const [vehicleForManifest, setVehicleForManifest] = useState<Vehicle | null>(null);
    
    const associateVehicles = useMemo(() => {
        return vehicles.filter(v => v.asociadoId === asociado.id);
    }, [vehicles, asociado.id]);

    const handleOpenVehicleModal = (vehicle: Vehicle | null) => {
        setEditingVehicle(vehicle);
        setIsVehicleModalOpen(true);
    };

    const handleSave = async (vehicle: Vehicle) => {
        await onSaveVehicle(vehicle);
        setIsVehicleModalOpen(false);
    };
    
    const handleOpenManifestModal = (vehicle: Vehicle) => {
        setVehicleForManifest(vehicle);
        setIsManifestModalOpen(true);
    }

    const getAssignedInvoices = (vehicleId: string) => {
        return invoices.filter(inv => inv.vehicleId === vehicleId);
    };

    return (
        <div className="space-y-4">
             <div className="mb-2">
                <Button variant="secondary" onClick={() => window.location.hash = 'flota'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver a Asociados
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Flota de {asociado.nombre}</CardTitle>
                        
                    </div>
                </CardHeader>
                <div className="flex overflow-x-auto space-x-6 pb-4">
                    {associateVehicles.length > 0 ? associateVehicles.map(vehicle => {
                        const assignedInvoices = getAssignedInvoices(vehicle.id);
                        const currentLoadKg = assignedInvoices.reduce((sum, inv) => sum + calculateInvoiceChargeableWeight(inv), 0);
                        const loadPercentage = vehicle.capacidadCarga > 0 ? (currentLoadKg / vehicle.capacidadCarga) * 100 : 0;
                        const status = statusInfo[vehicle.status];
                        
                        return (
                        <div key={vehicle.id} className="w-80 sm:w-96 flex-shrink-0">
                            <Card className="bg-gray-50 dark:bg-gray-800 flex flex-col p-0 h-full">
                                <div className="relative h-40 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                                    {vehicle.imageUrl ? (
                                        <img src={vehicle.imageUrl} alt={vehicle.modelo} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <TruckIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    )}
                                    <div className={`absolute top-2 right-2 px-2 py-1 text-xs text-white rounded-full font-semibold shadow-lg ${status.color}`}>
                                        {status.text}
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{vehicle.modelo}</p>
                                        <p className="text-sm font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded inline-block mb-2">{vehicle.placa}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Conductor: {vehicle.driver}</p>
                                        <div className="mt-2">
                                            <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                                <span>Carga Actual</span>
                                                <span>{currentLoadKg.toFixed(2)} / {vehicle.capacidadCarga} Kg</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                                                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min(loadPercentage, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-4">
                                        <div className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                                            <h4 className="font-semibold text-sm mb-2 flex items-center">
                                                <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                                                Envíos Asignados ({assignedInvoices.length})
                                            </h4>
                                            {assignedInvoices.length > 0 ? (
                                                <ul className="text-xs space-y-1 pl-2 border-l-2 border-primary-500 max-h-24 overflow-y-auto">
                                                    {assignedInvoices.map(inv => (
                                                        <li key={inv.id} className="flex justify-between items-center group pr-1">
                                                            <span>Factura #{inv.invoiceNumber}</span>
                                                            {vehicle.status === 'Disponible' && (
                                                                <button 
                                                                    onClick={async () => await onUnassignInvoice(inv.id)}
                                                                    className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remover envío del vehículo"
                                                                >
                                                                    <XIcon className="w-4 h-4"/>
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">Ningún envío asignado.</p>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap justify-end items-center gap-2 pt-2 border-t dark:border-gray-700">
                                            {vehicle.status === 'Disponible' && (
                                                <>
                                                    {permissions['flota.edit'] && <Button size="sm" variant="secondary" onClick={() => handleOpenVehicleModal(vehicle)} title="Editar Vehículo"><EditIcon className="w-4 h-4" /></Button>}
                                                    {permissions['flota.delete'] && <Button size="sm" variant="danger" onClick={async () => {
                                                        if (window.confirm(`¿Está seguro de que desea eliminar el vehículo '${vehicle.modelo} - ${vehicle.placa}'? Esta acción no se puede deshacer.`)) {
                                                            await onDeleteVehicle(vehicle.id);
                                                        }
                                                    }} title="Eliminar Vehículo"><TrashIcon className="w-4 h-4" /></Button>}
                                                </>
                                            )}
                                            
                                            <Button size="sm" variant="secondary" onClick={() => handleOpenManifestModal(vehicle)} disabled={assignedInvoices.length === 0} title="Generar Remesa/Manifiesto">
                                                <FileTextIcon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 w-full">
                            <p>Este asociado no tiene vehículos registrados.</p>
                        </div>
                    )}
                </div>
            </Card>

            {isVehicleModalOpen && (
                <VehicleFormModal
                    isOpen={isVehicleModalOpen}
                    onClose={() => setIsVehicleModalOpen(false)}
                    onSave={handleSave}
                    vehicle={editingVehicle}
                />
            )}

            {isManifestModalOpen && vehicleForManifest && (
                <VehicleShipmentManifest
                    isOpen={isManifestModalOpen}
                    onClose={() => setIsManifestModalOpen(false)}
                    vehicle={vehicleForManifest}
                    invoices={getAssignedInvoices(vehicleForManifest.id)}
                    offices={offices}
                    clients={clients}
                    companyInfo={companyInfo}
                />
            )}
        </div>
    );
};

export default FlotaVehiculosPorAsociadoView;