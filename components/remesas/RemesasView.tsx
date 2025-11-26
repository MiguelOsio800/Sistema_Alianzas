import React, { useState, useMemo } from 'react';
import { Remesa, Invoice, Asociado, Vehicle, Client, Office, CompanyInfo, Permissions, Category } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EyeIcon, TrashIcon, ClipboardDocumentListIcon, XIcon, PlayIcon, FileTextIcon } from '../icons/Icons';
import Select from '../ui/Select';
import RemesaDocumentModal from './RemesaDocumentModal';
import { calculateInvoiceChargeableWeight } from '../../utils/financials';
import AssignInvoiceModal from '../flota/AssignInvoiceModal';
import Input from '../ui/Input';

interface RemesasViewProps {
    remesas: Remesa[];
    asociados: Asociado[];
    vehicles: Vehicle[];
    invoices: Invoice[];
    offices: Office[];
    clients: Client[];
    categories: Category[];
    onAssignToVehicle: (invoiceIds: string[], vehicleId: string) => Promise<void>;
    onUnassignInvoice: (invoiceId: string) => Promise<void>;
    onDispatchVehicle: (vehicleId: string) => Promise<Remesa | null>;
    onDeleteRemesa: (remesaId: string) => Promise<void>;
    permissions: Permissions;
    companyInfo: CompanyInfo;
}

const RemesasView: React.FC<RemesasViewProps> = (props) => {
    const { 
        remesas, asociados, vehicles, invoices, offices, clients, categories,
        onAssignToVehicle, onUnassignInvoice, onDispatchVehicle, onDeleteRemesa,
        permissions, companyInfo 
    } = props;

    const [selectedAsociadoId, setSelectedAsociadoId] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [vehicleToAssign, setVehicleToAssign] = useState<Vehicle | null>(null);

    const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);
    const [remesaForManifest, setRemesaForManifest] = useState<Remesa | null>(null);

    const associateVehicles = useMemo(() => {
        if (!selectedAsociadoId) return [];
        return vehicles.filter(v => v.asociadoId === selectedAsociadoId);
    }, [vehicles, selectedAsociadoId]);

    const availableInvoices = invoices.filter(inv => !inv.vehicleId && inv.shippingStatus === 'Pendiente para Despacho' && inv.status === 'Activa');

    const filteredRemesas = useMemo(() => {
        let filtered = remesas;
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            filtered = filtered.filter(r => new Date(r.date) >= start);
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            filtered = filtered.filter(r => new Date(r.date) <= end);
        }
        return filtered;
    }, [remesas, startDate, endDate]);

    const handleOpenAssignModal = (vehicle: Vehicle) => {
        setVehicleToAssign(vehicle);
        setIsAssignModalOpen(true);
    };

    const handleAssignInvoices = async (invoiceIds: string[]) => {
        if(vehicleToAssign) {
            await onAssignToVehicle(invoiceIds, vehicleToAssign.id);
        }
        setIsAssignModalOpen(false);
    };
    
    const handleDispatchAndShowManifest = async (vehicleId: string) => {
        const newRemesa = await onDispatchVehicle(vehicleId);
        if (newRemesa) {
            setRemesaForManifest(newRemesa);
            setIsManifestModalOpen(true);
        }
    };


    const handleOpenManifestModal = (remesa: Remesa) => {
        setRemesaForManifest(remesa);
        setIsManifestModalOpen(true);
    };

    const getAssignedInvoices = (vehicleId: string) => {
        return invoices.filter(inv => inv.vehicleId === vehicleId && inv.shippingStatus === 'Pendiente para Despacho');
    };
    
    const getVehicleRemesas = (vehicleId: string) => {
        return filteredRemesas.filter(r => r.vehicleId === vehicleId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Remesas y Despachos</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Seleccione un asociado para ver sus vehículos, asignar cargas y generar remesas.</p>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                     <Select label="Seleccionar Asociado" value={selectedAsociadoId} onChange={e => setSelectedAsociadoId(e.target.value)}>
                        <option value="">-- Elija un Asociado --</option>
                        {asociados.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </Select>
                    <Input label="Desde" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <Input label="Hasta" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
            </Card>

            {selectedAsociadoId && (
                associateVehicles.length > 0 ? associateVehicles.map(vehicle => {
                    const assignedInvoices = getAssignedInvoices(vehicle.id);
                    const currentLoadKg = assignedInvoices.reduce((sum, inv) => sum + calculateInvoiceChargeableWeight(inv), 0);
                    const loadPercentage = vehicle.capacidadCarga > 0 ? (currentLoadKg / vehicle.capacidadCarga) * 100 : 0;
                    const vehicleRemesas = getVehicleRemesas(vehicle.id);
                    
                    return (
                        <Card key={vehicle.id}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Vehicle Info & Actions */}
                                <div className="md:col-span-1 border-r-0 md:border-r md:pr-6 dark:border-gray-700">
                                    <h3 className="font-bold text-lg text-primary-600 dark:text-primary-400">{vehicle.modelo}</h3>
                                    <p className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded inline-block mb-2 text-sm">{vehicle.placa}</p>
                                    <div className="mt-2 text-sm space-y-1">
                                        <p><strong>Conductor:</strong> {vehicle.driver}</p>
                                        <p><strong>Capacidad:</strong> {vehicle.capacidadCarga} Kg</p>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <span>Carga para Despacho</span>
                                            <span>{currentLoadKg.toFixed(2)} Kg</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                                            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min(loadPercentage, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <Button onClick={() => handleOpenAssignModal(vehicle)} className="w-full">
                                            <PlusIcon className="w-4 h-4 mr-2" /> Asignar Facturas
                                        </Button>
                                         <Button 
                                            onClick={() => handleDispatchAndShowManifest(vehicle.id)} 
                                            variant="primary" 
                                            className="w-full"
                                            disabled={assignedInvoices.length === 0}
                                        >
                                            <PlayIcon className="w-4 h-4 mr-2" /> Generar Remesa y Despachar
                                        </Button>
                                    </div>
                                    <div className="mt-4">
                                         <h4 className="font-semibold text-sm mb-2">Carga Actual ({assignedInvoices.length})</h4>
                                         {assignedInvoices.length > 0 ? (
                                             <ul className="text-xs space-y-1 max-h-32 overflow-y-auto pr-1">
                                                {assignedInvoices.map(inv => (
                                                    <li key={inv.id} className="flex justify-between items-center group p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50">
                                                        <span>Factura #{inv.invoiceNumber}</span>
                                                        <button onClick={async () => await onUnassignInvoice(inv.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover">
                                                            <XIcon className="w-4 h-4"/>
                                                        </button>
                                                    </li>
                                                ))}
                                             </ul>
                                         ) : <p className="text-xs text-gray-500 italic">No hay facturas asignadas para el próximo despacho.</p>}
                                    </div>
                                </div>
                                
                                {/* Remesa History */}
                                <div className="md:col-span-2">
                                    <h3 className="font-semibold text-lg mb-2">Historial de Remesas del Vehículo</h3>
                                    <div className="overflow-x-auto max-h-80">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                <tr>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nº Remesa</th>
                                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Facturas</th>
                                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Monto Total</th>
                                                    <th className="relative px-2 py-2"><span className="sr-only"></span></th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                {vehicleRemesas.map(rem => (
                                                    <tr key={rem.id}>
                                                        <td className="px-2 py-2 font-mono text-gray-800 dark:text-gray-200">{rem.remesaNumber}</td>
                                                        <td className="px-2 py-2 text-gray-800 dark:text-gray-200">{rem.date}</td>
                                                        <td className="px-2 py-2 text-center text-gray-800 dark:text-gray-200">{rem.invoiceIds.length}</td>
                                                        <td className="px-2 py-2 text-right font-semibold text-gray-800 dark:text-gray-200">{rem.totalAmount.toLocaleString('es-VE')} Bs.</td>
                                                        <td className="px-2 py-2 text-right space-x-1">
                                                            <Button size="sm" variant="secondary" onClick={() => handleOpenManifestModal(rem)}><EyeIcon className="w-4 h-4"/></Button>
                                                            {permissions['remesas.delete'] && <Button size="sm" variant="danger" onClick={async () => {
                                                                if (window.confirm('¿Está seguro de que desea eliminar esta remesa? Las facturas asociadas volverán al estado "Pendiente para Despacho".')) {
                                                                    await onDeleteRemesa(rem.id);
                                                                }
                                                            }}><TrashIcon className="w-4 h-4"/></Button>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {vehicleRemesas.length === 0 && <p className="text-center py-6 text-sm text-gray-500">Este vehículo no tiene historial de remesas para las fechas seleccionadas.</p>}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )
                }) : (
                     <Card>
                        <p className="text-center py-8 text-gray-500 dark:text-gray-400">El asociado seleccionado no tiene vehículos registrados.</p>
                     </Card>
                )
            )}

            {isAssignModalOpen && vehicleToAssign && (
                <AssignInvoiceModal
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    onAssign={handleAssignInvoices}
                    vehicle={vehicleToAssign}
                    allInvoices={invoices}
                    availableInvoices={availableInvoices}
                    offices={offices}
                />
            )}
            
            {isManifestModalOpen && remesaForManifest && (
                 <RemesaDocumentModal
                    isOpen={isManifestModalOpen}
                    onClose={() => setIsManifestModalOpen(false)}
                    remesa={remesaForManifest}
                    invoices={invoices}
                    asociados={asociados}
                    vehicles={vehicles}
                    clients={clients}
                    companyInfo={companyInfo}
                    offices={offices}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default RemesasView;