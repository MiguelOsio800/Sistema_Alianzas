import React, { useState, useCallback } from 'react';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { Invoice, Vehicle, Expense, Office } from '../../types';
import { CheckCircleIcon, ExclamationTriangleIcon, SearchIcon, TrashIcon } from '../icons/Icons';
import { useToast } from '../ui/ToastProvider';

interface CleanupToolProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    vehicles: Vehicle[];
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    offices: Office[];
}

const CleanupTool: React.FC<CleanupToolProps> = ({ invoices, setInvoices, vehicles, expenses, setExpenses, offices }) => {
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [orphanInvoices, setOrphanInvoices] = useState<Invoice[]>([]);
    const [orphanExpenses, setOrphanExpenses] = useState<Expense[]>([]);

    const handleScan = useCallback(() => {
        setIsScanning(true);
        
        // Find orphan invoices (assigned to a non-existent vehicle)
        const vehicleIds = new Set(vehicles.map(v => v.id));
        const foundOrphanInvoices = invoices.filter(inv => inv.vehicleId && !vehicleIds.has(inv.vehicleId));
        setOrphanInvoices(foundOrphanInvoices);

        // Find orphan expenses (assigned to a non-existent office)
        const officeIds = new Set(offices.map(o => o.id));
        const foundOrphanExpenses = expenses.filter(exp => exp.officeId && !officeIds.has(exp.officeId));
        setOrphanExpenses(foundOrphanExpenses);

        setIsScanning(false);

        if (foundOrphanInvoices.length === 0 && foundOrphanExpenses.length === 0) {
            addToast({ type: 'success', title: 'Escaneo Completo', message: 'No se encontraron inconsistencias en los datos.' });
        } else {
            addToast({ type: 'warning', title: 'Escaneo Completo', message: `Se encontraron ${foundOrphanInvoices.length + foundOrphanExpenses.length} problemas.` });
        }
    }, [invoices, vehicles, expenses, offices, addToast]);

    const handleFixOrphanInvoice = (invoiceId: string) => {
        setInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, vehicleId: undefined } : inv));
        setOrphanInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
        addToast({ type: 'info', title: 'Factura Corregida', message: `Factura ${invoiceId} desasignada del vehículo no existente.` });
    };

    const handleFixOrphanExpense = (expenseId: string) => {
        setExpenses(prev => prev.map(exp => exp.id === expenseId ? { ...exp, officeId: undefined } : exp));
        setOrphanExpenses(prev => prev.filter(exp => exp.id !== expenseId));
        addToast({ type: 'info', title: 'Gasto Corregido', message: `Gasto ${expenseId} desasignado de la oficina no existente.` });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Herramienta de Limpieza de Datos</CardTitle>
                    <Button onClick={handleScan} disabled={isScanning}>
                        <SearchIcon className="w-4 h-4 mr-2" /> {isScanning ? 'Escaneando...' : 'Escanear Problemas'}
                    </Button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Busca y corrige inconsistencias como facturas o gastos asignados a vehículos u oficinas que ya no existen.</p>
            </CardHeader>
            <div className="space-y-6">
                {/* Orphan Invoices */}
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Facturas Huérfanas ({orphanInvoices.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-md p-2">
                        {orphanInvoices.length > 0 ? orphanInvoices.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <div className="text-sm">
                                    <p>Factura <strong className="font-mono">{inv.invoiceNumber}</strong></p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400">Asignada a vehículo no existente (ID: {inv.vehicleId})</p>
                                </div>
                                <Button size="sm" onClick={() => handleFixOrphanInvoice(inv.id)}>Corregir</Button>
                            </div>
                        )) : (
                            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron facturas huérfanas.</p>
                        )}
                    </div>
                </div>

                {/* Orphan Expenses */}
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Gastos Huérfanos ({orphanExpenses.length})</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-md p-2">
                         {orphanExpenses.length > 0 ? orphanExpenses.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                                <div className="text-sm">
                                    <p>Gasto: <strong className="font-mono">{exp.description}</strong></p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-400">Asignado a oficina no existente (ID: {exp.officeId})</p>
                                </div>
                                <Button size="sm" onClick={() => handleFixOrphanExpense(exp.id)}>Corregir</Button>
                            </div>
                        )) : (
                            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No se encontraron gastos huérfanos.</p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CleanupTool;
