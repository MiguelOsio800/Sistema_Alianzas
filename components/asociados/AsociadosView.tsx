
import React, { useState, useMemo } from 'react';
import { Asociado, Vehicle, Certificado, PagoAsociado, ReciboPagoAsociado, Permissions, CompanyInfo } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SearchIcon, PlusIcon, UserIcon, ArrowLeftIcon, PlusCircleIcon } from '../icons/Icons';
import AsociadoDetailView from './AsociadoDetailView';
import GenerarDeudaMasivaModal from './GenerarDeudaMasivaModal';
import { useToast } from '../ui/ToastProvider';

interface AsociadosGestionViewProps {
    asociados: Asociado[];
    onSaveAsociado: (asociado: Asociado) => Promise<void>;
    onDeleteAsociado: (asociadoId: string) => Promise<void>;
    vehicles: Vehicle[];
    onSaveVehicle: (vehicle: Vehicle) => Promise<void>;
    onDeleteVehicle: (vehicleId: string) => Promise<void>;
    certificados: Certificado[];
    onSaveCertificado: (certificado: Certificado) => Promise<void>;
    onDeleteCertificado: (certificadoId: string) => Promise<void>;
    pagos: PagoAsociado[];
    onSavePago: (pago: PagoAsociado) => Promise<void>;
    onDeletePago: (pagoId: string) => Promise<void>;
    recibos: ReciboPagoAsociado[];
    onSaveRecibo: (recibo: ReciboPagoAsociado) => Promise<void>;
    permissions: Permissions;
    companyInfo: CompanyInfo;
}

const AsociadosGestionView: React.FC<AsociadosGestionViewProps> = (props) => {
    const { asociados, permissions, onSaveAsociado, onSavePago } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAsociado, setSelectedAsociado] = useState<Asociado | null>(null);
    const [isMassiveDebtModalOpen, setIsMassiveDebtModalOpen] = useState(false);
    const { addToast } = useToast();

    const filteredAsociados = useMemo(() => {
        if (!searchTerm) return asociados;
        const lowercasedTerm = searchTerm.toLowerCase();
        return asociados.filter(a =>
            a.nombre.toLowerCase().includes(lowercasedTerm) ||
            a.codigo.toLowerCase().includes(lowercasedTerm) ||
            a.cedula.includes(lowercasedTerm)
        );
    }, [asociados, searchTerm]);

    const handleSelectAsociado = (asociado: Asociado) => {
        setSelectedAsociado(asociado);
    };
    
    const handleCreateNew = () => {
        const newAsociado: Asociado = {
            id: '',
            codigo: '',
            nombre: 'Nuevo Asociado',
            cedula: '',
            fechaNacimiento: new Date().toISOString().split('T')[0],
            fechaIngreso: new Date().toISOString().split('T')[0],
            telefono: '',
            direccion: '',
            status: 'Activo',
        };
        setSelectedAsociado(newAsociado);
    };

    const handleBackToList = () => {
        setSelectedAsociado(null);
    };
    
    const handleGenerateMassiveDebt = (debtData: {
        concepto: string,
        cuotas: string,
        montoBs: number,
        montoUsd: number,
        fechaVencimiento: string,
        applyTo: 'Activo' | 'Todos'
    }) => {
        const { applyTo, ...pagoData } = debtData;
        
        const associatesToApply = applyTo === 'Activo'
            ? asociados.filter(a => a.status === 'Activo')
            : asociados;

        if (associatesToApply.length === 0) {
            addToast({ type: 'warning', title: 'Sin Destinatarios', message: 'No se encontraron asociados que cumplan con el criterio.' });
            return;
        }

        associatesToApply.forEach(asociado => {
            const newPago: Omit<PagoAsociado, 'id' | 'reciboId'> = {
                ...pagoData,
                asociadoId: asociado.id,
                status: 'Pendiente',
            };
            onSavePago(newPago as PagoAsociado);
        });

        addToast({ type: 'success', title: 'Operación Exitosa', message: `Se han generado ${associatesToApply.length} deudas.` });
        setIsMassiveDebtModalOpen(false);
    };

    
    if (selectedAsociado) {
        return <AsociadoDetailView 
            asociado={selectedAsociado} 
            onBack={handleBackToList}
            onSaveAsociado={onSaveAsociado}
            vehicles={props.vehicles}
            onSaveVehicle={props.onSaveVehicle}
            onDeleteVehicle={props.onDeleteVehicle}
            certificados={props.certificados}
            onSaveCertificado={props.onSaveCertificado}
            onDeleteCertificado={props.onDeleteCertificado}
            permissions={props.permissions}
        />
    }

    return (
        <div className="space-y-4">
             <Button variant="secondary" onClick={() => window.location.hash = 'asociados'}>
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Volver al Módulo de Asociados
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <CardTitle>Búsqueda de Asociados</CardTitle>
                         <div className="flex items-center gap-2">
                            {permissions['asociados.create'] && (
                                <Button onClick={() => setIsMassiveDebtModalOpen(true)} variant="secondary">
                                    <PlusCircleIcon className="w-4 h-4 mr-2" /> Generar Deuda Masiva
                                </Button>
                            )}
                            {permissions['asociados.create'] && (
                                 <Button onClick={handleCreateNew}>
                                    <PlusIcon className="w-4 h-4 mr-2" /> Nuevo Asociado
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 max-w-lg">
                        <Input 
                            label=""
                            id="search-asociados" 
                            placeholder="Buscar por código, nombre o cédula..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            icon={<SearchIcon className="w-4 h-4 text-gray-400"/>} 
                        />
                    </div>
                </CardHeader>

                <div className="mt-4 space-y-3">
                    {filteredAsociados.length > 0 ? filteredAsociados.map(asociado => (
                         <div key={asociado.id} 
                            className="p-4 border dark:border-gray-700 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => handleSelectAsociado(asociado)}
                         >
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                                    <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-400"/>
                                </div>
                                <div>
                                    <p className="font-bold text-primary-600 dark:text-primary-400">{asociado.nombre}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Código: {asociado.codigo} - C.I: {asociado.cedula}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${asociado.status === 'Activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                {asociado.status}
                            </span>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No se encontraron asociados.</p>
                            {searchTerm && <p className="text-sm">Intente con otro término de búsqueda.</p>}
                        </div>
                    )}
                </div>
            </Card>
            <GenerarDeudaMasivaModal
                isOpen={isMassiveDebtModalOpen}
                onClose={() => setIsMassiveDebtModalOpen(false)}
                onGenerate={handleGenerateMassiveDebt}
                companyInfo={props.companyInfo}
            />
        </div>
    );
};

export default AsociadosGestionView;
