

import React, { useState, useMemo } from 'react';
import { Invoice, Vehicle, Office } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { calculateInvoiceChargeableWeight } from '../../utils/financials';
import { ExclamationTriangleIcon } from '../icons/Icons';

interface AssignInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (invoiceIds: string[]) => void;
    vehicle: Vehicle;
    availableInvoices: Invoice[];
    allInvoices: Invoice[]; // all invoices to calculate current load
    offices: Office[];
}

const AssignInvoiceModal: React.FC<AssignInvoiceModalProps> = ({ isOpen, onClose, onAssign, vehicle, availableInvoices, allInvoices, offices }) => {
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);

    const { currentLoadKg, remainingCapacity, selectedInvoicesWeight, exceedsCapacity } = useMemo(() => {
        const currentLoadKg = allInvoices
            .filter(i => i.vehicleId === vehicle.id)
            .reduce((sum, inv) => sum + calculateInvoiceChargeableWeight(inv), 0);
        
        const remainingCapacity = vehicle.capacidadCarga - currentLoadKg;

        const selectedInvoicesWeight = selectedInvoiceIds.reduce((sum, id) => {
            const invoice = availableInvoices.find(inv => inv.id === id);
            return sum + (invoice ? calculateInvoiceChargeableWeight(invoice) : 0);
        }, 0);
        
        const exceedsCapacity = selectedInvoicesWeight > remainingCapacity;

        return { currentLoadKg, remainingCapacity, selectedInvoicesWeight, exceedsCapacity };
    }, [allInvoices, availableInvoices, selectedInvoiceIds, vehicle]);


    const handleToggleInvoice = (invoiceId: string) => {
        setSelectedInvoiceIds(prev =>
            prev.includes(invoiceId)
                ? prev.filter(id => id !== invoiceId)
                : [...prev, invoiceId]
        );
    };

    const handleAssignClick = () => {
        if (selectedInvoiceIds.length > 0 && !exceedsCapacity) {
            onAssign(selectedInvoiceIds);
        }
    };

    const getOfficeName = (officeId: string) => offices.find(o => o.id === officeId)?.name || officeId;
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Asignar Envíos a ${vehicle.modelo} - ${vehicle.placa}`}>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {availableInvoices.length > 0 ? availableInvoices.map(invoice => {
                    const weight = calculateInvoiceChargeableWeight(invoice);
                    return (
                        <div
                            key={invoice.id}
                            onClick={() => handleToggleInvoice(invoice.id)}
                            className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                                selectedInvoiceIds.includes(invoice.id)
                                ? 'bg-green-50 dark:bg-green-900/30 border-green-400 ring-2 ring-green-300'
                                : 'bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            <div>
                                <p className="font-semibold text-primary-600 dark:text-primary-400">{invoice.invoiceNumber}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.clientName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm">{getOfficeName(invoice.guide.destinationOfficeId)}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{weight.toFixed(2)} kg</p>
                            </div>
                        </div>
                    )
                }) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay facturas listas para despacho.</p>
                )}
            </div>
            <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Capacidad Restante:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{remainingCapacity.toFixed(2)} Kg</span>
                </div>
                 <div className={`flex justify-between ${exceedsCapacity ? 'text-red-500' : ''}`}>
                    <span className="font-semibold">Peso Seleccionado:</span>
                    <span className="font-bold">{selectedInvoicesWeight.toFixed(2)} Kg</span>
                </div>
                {exceedsCapacity && (
                     <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md text-xs flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4"/>
                        El peso seleccionado excede la capacidad restante del vehículo.
                    </div>
                )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-2">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleAssignClick} disabled={selectedInvoiceIds.length === 0 || exceedsCapacity}>
                    Asignar ({selectedInvoiceIds.length}) Envíos
                </Button>
            </div>
        </Modal>
    );
};

export default AssignInvoiceModal;