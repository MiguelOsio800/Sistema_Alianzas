import React, { useState, useMemo } from 'react';
import { Vehicle, Certificado } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { PlusIcon, EditIcon, TrashIcon, SaveIcon, ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';
import CertificadoFormModal from './CertificadoFormModal';
import { useToast } from '../ui/ToastProvider';

interface CertificadoVehiculoTabProps {
    asociadoId: string;
    vehicles: Vehicle[];
    onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
    onDeleteVehicle: (vehicleId: string) => Promise<void>;
    certificados: Certificado[];
    onSaveCertificado: (certificado: Certificado) => Promise<void>;
    onDeleteCertificado: (certificadoId: string) => Promise<void>;
}

const emptyVehicle: Partial<Vehicle> = {
    placa: '',
    modelo: '',
    ano: new Date().getFullYear(),
    color: '',
    serialCarroceria: '',
    serialMotor: '',
    tipo: '',
    uso: '',
    servicio: '',
    nroPuestos: 0,
    nroEjes: 0,
    tara: 0,
    capacidadCarga: 0,
    clase: '',
    actividadVehiculo: 'Carga',
};

const AccordionItem: React.FC<{
    title: string;
    id: string;
    openId: string | null;
    setOpenId: React.Dispatch<React.SetStateAction<string | null>>;
    children: React.ReactNode;
}> = ({ title, id, openId, setOpenId, children }) => {
    const isOpen = openId === id;
    return (
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
            <button
                type="button"
                className="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setOpenId(isOpen ? null : id)}
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${id}`}
            >
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                 <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon className="w-5 h-5" />
                </div>
            </button>
            <div
                id={`accordion-content-${id}`}
                className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 bg-white dark:bg-gray-800">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const CertificadoVehiculoTab: React.FC<CertificadoVehiculoTabProps> = (props) => {
    const { 
        asociadoId, vehicles, onSaveVehicle, onDeleteVehicle, 
        certificados, onSaveCertificado, onDeleteCertificado 
    } = props;
    
    const { addToast } = useToast();
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<Partial<Vehicle> | null>(null);
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [editingCertificado, setEditingCertificado] = useState<Certificado | null>(null);
    const [vehicleIdForCertModal, setVehicleIdForCertModal] = useState<string | null>(null);
    const [openAccordion, setOpenAccordion] = useState<string | null>('principal');


    const associateVehicles = useMemo(() => vehicles.filter(v => v.asociadoId === asociadoId), [vehicles, asociadoId]);
    const vehicleCertificados = useMemo(() => {
        if (!selectedVehicle || !selectedVehicle.id) return [];
        return certificados.filter(c => c.vehiculoId === selectedVehicle.id);
    }, [certificados, selectedVehicle]);

    const handleSelectVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setViewMode('form');
        setOpenAccordion('principal');
    };

    const handleNewVehicle = () => {
        setSelectedVehicle({ ...emptyVehicle, asociadoId });
        setViewMode('form');
        setOpenAccordion('principal');
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedVehicle(null);
    };

    const handleVehicleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setSelectedVehicle(prev => prev ? ({ ...prev, [name]: type === 'number' ? Number(value) : value }) : null);
    };

    const handleVehicleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVehicle) {
            await onSaveVehicle(selectedVehicle as Vehicle);
            handleBackToList();
        }
    };
    
    const handleCertificateStatusChange = async (cert: Certificado, newStatus: Certificado['status']) => {
        const updatedCert = { ...cert, status: newStatus };
        await onSaveCertificado(updatedCert);
        addToast({ type: 'info', title: 'Estado Actualizado', message: `El estado del certificado se cambió a ${newStatus}.`});
    };

    const handleOpenCertModal = (vehicleId: string, cert: Certificado | null) => {
        setVehicleIdForCertModal(vehicleId);
        setEditingCertificado(cert);
        setIsCertModalOpen(true);
    };

    const handleSaveCert = async (cert: Certificado) => {
        await onSaveCertificado(cert);
        setIsCertModalOpen(false);
    };
    
    const renderListView = () => (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={handleNewVehicle}><PlusIcon className="w-4 h-4 mr-2" />Añadir Vehículo</Button>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {associateVehicles.map(v => {
                    const vehicleCerts = certificados.filter(c => c.vehiculoId === v.id);
                    return (
                        <Card key={v.id} className="p-0 flex flex-col">
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{v.modelo}</p>
                                        <p className="text-sm font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded inline-block">{v.placa}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => handleSelectVehicle(v)}><EditIcon className="w-4 h-4" /></Button>
                                        <Button variant="danger" size="sm" onClick={async () => {
                                            if (window.confirm(`¿Está seguro de que desea eliminar el vehículo con placa '${v.placa}'? Esta acción no se puede deshacer.`)) {
                                                await onDeleteVehicle(v.id);
                                            }
                                        }}><TrashIcon className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                                    <span><strong>Año:</strong> {v.ano}</span>
                                    <span><strong>Actividad:</strong> {v.actividadVehiculo}</span>
                                    <span><strong>Capacidad:</strong> {v.capacidadCarga} Kg</span>
                                    <span><strong>Color:</strong> {v.color}</span>
                                </div>
                            </div>
                            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-grow">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Certificados</h4>
                                    <Button size="sm" variant="secondary" onClick={() => handleOpenCertModal(v.id, null)}>
                                        <PlusIcon className="w-3 h-3 mr-1" /> Añadir
                                    </Button>
                                </div>
                                {vehicleCerts.length > 0 ? (
                                    <ul className="space-y-2 text-xs">
                                        {vehicleCerts.map(cert => (
                                            <li key={cert.id} className="p-2 rounded-md bg-white dark:bg-gray-900/50 flex justify-between items-center text-gray-600 dark:text-gray-300">
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{cert.descripcion}</p>
                                                    <p>Inicio: {cert.fechaInicio}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                    cert.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-300' : 
                                                    cert.status === 'Suspendido' ? 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-300' :
                                                    cert.status === 'Excluido' ? 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300'}`
                                                }>{cert.status}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-center text-gray-500 py-2">Sin certificados.</p>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
             {associateVehicles.length === 0 && <p className="text-center py-8 text-gray-500">Este asociado no tiene vehículos registrados.</p>}
        </>
    );

    const renderFormView = () => (
        selectedVehicle && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{selectedVehicle.id ? 'Editando Vehículo' : 'Nuevo Vehículo'}</h3>
                <Button variant="secondary" onClick={handleBackToList}><ArrowLeftIcon className="w-4 h-4 mr-2" />Volver a la Lista</Button>
            </div>
            
            <form onSubmit={handleVehicleFormSubmit} className="space-y-4">
                 <AccordionItem title="Identificación Principal" id="principal" openId={openAccordion} setOpenId={setOpenAccordion}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Modelo Vehículo" name="modelo" value={selectedVehicle.modelo || ''} onChange={handleVehicleFormChange} required />
                        <Input label="Placa" name="placa" value={selectedVehicle.placa || ''} onChange={handleVehicleFormChange} required />
                        <Input label="Año" name="ano" type="number" value={selectedVehicle.ano || ''} onChange={handleVehicleFormChange} required />
                    </div>
                </AccordionItem>
                
                <AccordionItem title="Detalles de Identificación" id="detalles" openId={openAccordion} setOpenId={setOpenAccordion}>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input label="Serial Carrocería" name="serialCarroceria" value={selectedVehicle.serialCarroceria || ''} onChange={handleVehicleFormChange} />
                        <Input label="Serial Motor" name="serialMotor" value={selectedVehicle.serialMotor || ''} onChange={handleVehicleFormChange} />
                        <Input label="Color" name="color" value={selectedVehicle.color || ''} onChange={handleVehicleFormChange} />
                        <Input label="Clase" name="clase" value={selectedVehicle.clase || ''} onChange={handleVehicleFormChange} />
                    </div>
                </AccordionItem>

                <AccordionItem title="Especificaciones de Operación" id="operacion" openId={openAccordion} setOpenId={setOpenAccordion}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input label="Tipo" name="tipo" value={selectedVehicle.tipo || ''} onChange={handleVehicleFormChange} />
                        <Input label="Uso" name="uso" value={selectedVehicle.uso || ''} onChange={handleVehicleFormChange} />
                        <Input label="Servicio" name="servicio" value={selectedVehicle.servicio || ''} onChange={handleVehicleFormChange} />
                        <Select label="Actividad Vehículo" name="actividadVehiculo" value={selectedVehicle.actividadVehiculo || 'Carga'} onChange={handleVehicleFormChange} required>
                            <option value="Carga">Carga</option>
                            <option value="Pasajero">Pasajero</option>
                        </Select>
                    </div>
                </AccordionItem>

                <AccordionItem title="Capacidad" id="capacidad" openId={openAccordion} setOpenId={setOpenAccordion}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input label="Nº Puestos" name="nroPuestos" type="number" value={selectedVehicle.nroPuestos || ''} onChange={handleVehicleFormChange} />
                        <Input label="Nº Ejes" name="nroEjes" type="number" value={selectedVehicle.nroEjes || ''} onChange={handleVehicleFormChange} />
                        <Input label="Tara (Kg)" name="tara" type="number" value={selectedVehicle.tara || ''} onChange={handleVehicleFormChange} />
                        <Input label="Cap. Carga (Kg)" name="capacidadCarga" type="number" value={selectedVehicle.capacidadCarga || ''} onChange={handleVehicleFormChange} />
                    </div>
                </AccordionItem>
                
                {/* Certificate Management for this vehicle */}
                {selectedVehicle.id && (
                    <AccordionItem title={`Certificados (${vehicleCertificados.length})`} id="certificados" openId={openAccordion} setOpenId={setOpenAccordion}>
                        <div className="flex justify-end items-center mb-4">
                            <Button type="button" onClick={() => handleOpenCertModal(selectedVehicle.id as string, null)}><PlusIcon className="w-4 h-4 mr-2" />Nuevo Certificado</Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Descripción</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Fecha Inicio</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Estado</th>
                                        <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {vehicleCertificados.map(c => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{c.descripcion}</td>
                                            <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{c.fechaInicio}</td>
                                            <td className="px-4 py-2">
                                                <Select label="" value={c.status} onChange={async (e) => await handleCertificateStatusChange(c, e.target.value as Certificado['status'])}>
                                                    <option value="Activo">Activo</option>
                                                    <option value="Inactivo">Inactivo</option>
                                                    <option value="Suspendido">Suspendido</option>
                                                    <option value="Excluido">Excluido</option>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-2 text-right space-x-2">
                                                <Button variant="secondary" size="sm" type="button" onClick={() => handleOpenCertModal(selectedVehicle.id!, c)}><EditIcon className="w-4 h-4" /></Button>
                                                <Button variant="danger" size="sm" type="button" onClick={async () => {
                                                    if (window.confirm('¿Está seguro de que desea eliminar este certificado? Esta acción no se puede deshacer.')) {
                                                        await onDeleteCertificado(c.id);
                                                    }
                                                }}><TrashIcon className="w-4 h-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {vehicleCertificados.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-4 text-gray-500">No hay certificados para este vehículo.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </AccordionItem>
                )}
                <div className="flex justify-end pt-4"><Button type="submit"><SaveIcon className="w-4 h-4 mr-2" />Guardar Vehículo</Button></div>
            </form>
        </div>
    ));

    return (
        <Card>
            {viewMode === 'list' ? renderListView() : renderFormView()}
            {isCertModalOpen && vehicleIdForCertModal && (
                 <CertificadoFormModal
                    isOpen={isCertModalOpen}
                    onClose={() => setIsCertModalOpen(false)}
                    onSave={handleSaveCert}
                    certificado={editingCertificado}
                    vehiculoId={vehicleIdForCertModal}
                />
            )}
        </Card>
    );
};

export default CertificadoVehiculoTab;