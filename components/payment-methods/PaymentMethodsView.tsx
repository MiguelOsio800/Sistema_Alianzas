import React, { useState } from 'react';
import { PaymentMethod, Permissions } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { PlusIcon, EditIcon, TrashIcon, ArrowLeftIcon, BanknotesIcon, BuildingOfficeIcon, DevicePhoneMobileIcon, CreditCardIcon } from '../icons/Icons';
import PaymentMethodFormModal from './PaymentMethodFormModal';

interface PaymentMethodsViewProps {
    paymentMethods: PaymentMethod[];
    onSave: (paymentMethod: PaymentMethod) => Promise<void>;
    onDelete: (paymentMethodId: string) => Promise<void>;
    permissions: Permissions;
}

const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between text-sm py-1.5 border-b border-gray-200 dark:border-gray-700/50 last:border-b-0">
            <span className="text-gray-500 dark:text-gray-400">{label}:</span>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-right">{value}</span>
        </div>
    );
};

const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({ paymentMethods, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);

    const handleOpenModal = (paymentMethod: PaymentMethod | null) => {
        setEditingPaymentMethod(paymentMethod);
        setIsModalOpen(true);
    };

    const handleSave = async (paymentMethod: PaymentMethod) => {
        await onSave(paymentMethod);
        setIsModalOpen(false);
    };
    
    const getIconForType = (type: PaymentMethod['type']) => {
        switch (type) {
            case 'Transferencia': return <BuildingOfficeIcon className="w-6 h-6 text-blue-500" />;
            case 'PagoMovil': return <DevicePhoneMobileIcon className="w-6 h-6 text-purple-500" />;
            case 'Efectivo': return <BanknotesIcon className="w-6 h-6 text-green-500" />;
            case 'Credito': return <CreditCardIcon className="w-6 h-6 text-orange-500" />;
            default: return <CreditCardIcon className="w-6 h-6 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'configuracion'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver a Configuración
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Gestión de Formas de Pago</CardTitle>
                        {permissions['payment-methods.create'] && (
                            <Button onClick={() => handleOpenModal(null)}>
                                <PlusIcon className="w-4 h-4 mr-2" /> Nueva Forma de Pago
                            </Button>
                        )}
                    </div>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure las cuentas bancarias, pago móvil y otras formas de pago de la empresa.</p>
                </CardHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paymentMethods.map(pm => (
                        <div key={pm.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                                {getIconForType(pm.type)}
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">{pm.name}</h3>
                                    <span className="text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 px-2 py-0.5 rounded-full">{pm.type}</span>
                                </div>
                            </div>
                            <div className="p-4 space-y-2 flex-grow">
                                {pm.type === 'Transferencia' && (
                                    <>
                                        <DetailItem label="Banco" value={pm.bankName} />
                                        <DetailItem label="N° Cuenta" value={pm.accountNumber} />
                                        <DetailItem label="Tipo" value={pm.accountType} />
                                        <DetailItem label="Beneficiario" value={pm.beneficiaryName} />
                                        <DetailItem label="RIF/CI" value={pm.beneficiaryId} />
                                        <DetailItem label="Email" value={pm.email} />
                                    </>
                                )}
                                {pm.type === 'PagoMovil' && (
                                    <>
                                        <DetailItem label="Banco" value={pm.bankName} />
                                        <DetailItem label="Teléfono" value={pm.phone} />
                                        <DetailItem label="Beneficiario" value={pm.beneficiaryName} />
                                        <DetailItem label="CI" value={pm.beneficiaryId} />
                                    </>
                                )}
                                {(pm.type === 'Efectivo' || pm.type === 'Credito' || pm.type === 'Otro') && (
                                     <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-8">No hay detalles adicionales.</p>
                                )}
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-900/40 rounded-b-lg flex justify-end items-center gap-2">
                                {permissions['payment-methods.edit'] && (
                                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(pm)}><EditIcon className="w-4 h-4"/></Button>
                                )}
                                {permissions['payment-methods.delete'] && (
                                    <Button variant="danger" size="sm" onClick={async () => {
                                        if (window.confirm('¿Está seguro de que desea eliminar esta forma de pago? Esta acción no se puede deshacer.')) {
                                            await onDelete(pm.id);
                                        }
                                    }}><TrashIcon className="w-4 h-4"/></Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                 {paymentMethods.length === 0 && <p className="text-center py-12 text-gray-500">No se han configurado formas de pago.</p>}
            </Card>

            <PaymentMethodFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                paymentMethod={editingPaymentMethod}
            />
        </div>
    );
};

export default PaymentMethodsView;