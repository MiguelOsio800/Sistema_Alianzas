

import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Transaction } from './LibroContableView';
import { Invoice, Expense, CompanyInfo, PaymentMethod, AsientoManual, CuentaContable } from '../../types';
import { calculateFinancialDetails } from '../../utils/financials';
import { FileSpreadsheetIcon } from '../icons/Icons';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

interface AsientoEntry {
    accountName: string;
    debit: number;
    credit: number;
}
interface Asiento {
    id: string; // From original transaction
    date: string;
    description: string;
    entries: AsientoEntry[];
}

interface LibroDiarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    asientosManuales: AsientoManual[];
    cuentasContables: CuentaContable[];
    companyInfo: CompanyInfo;
    paymentMethods: PaymentMethod[];
}

const ITEMS_PER_PAGE = 10; // Fewer items per page as asientos can be long

const formatCurrency = (amount: number) => amount === 0 ? '' : `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatCurrencyForExport = (amount: number) => amount === 0 ? null : amount;


const LibroDiarioModal: React.FC<LibroDiarioModalProps> = ({ isOpen, onClose, transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods }) => {
    
    const asientos = useMemo((): Asiento[] => {
        const generatedAsientos: Asiento[] = [];

        // 1. Process automated transactions
        transactions.forEach(t => {
            const asiento: Asiento = {
                id: t.id,
                date: t.date,
                description: '',
                entries: []
            };

            if (t.type === 'Ingreso') {
                const invoice = t.originalDoc as Invoice;
                if (invoice.status === 'Anulada') return;

                const financials = calculateFinancialDetails(invoice.guide, companyInfo);
                const paymentMethod = paymentMethods.find(p => p.id === invoice.guide.paymentMethodId)?.name || 'Caja/Banco';

                asiento.description = `Venta según Factura ${invoice.invoiceNumber}`;
                
                if (invoice.paymentStatus === 'Pagada' && invoice.guide.paymentType === 'flete-pagado') {
                    asiento.entries.push({ accountName: paymentMethod, debit: financials.total, credit: 0 });
                } else {
                    asiento.entries.push({ accountName: `Cuentas por Cobrar - ${invoice.clientName}`, debit: financials.total, credit: 0 });
                }
                
                if(invoice.guide.paymentType === 'flete-destino' && invoice.paymentStatus === 'Pagada') {
                    asiento.entries.push({ accountName: paymentMethod, debit: financials.total, credit: 0 });
                    asiento.entries.push({ accountName: `Cuentas por Cobrar - ${invoice.clientName}`, debit: 0, credit: financials.total });
                }

                asiento.entries.push({ accountName: 'Ingresos por Servicios de Flete', debit: 0, credit: financials.freight });
                asiento.entries.push({ accountName: 'Ingresos por Manejo', debit: 0, credit: financials.handling });
                if (financials.insuranceCost > 0) asiento.entries.push({ accountName: 'Ingresos por Seguro', debit: 0, credit: financials.insuranceCost });
                if (financials.discount > 0) asiento.entries.push({ accountName: 'Descuentos en Ventas', debit: financials.discount, credit: 0 });
                if (financials.iva > 0) asiento.entries.push({ accountName: 'IVA Débito Fiscal', debit: 0, credit: financials.iva });
                if (financials.ipostel > 0) asiento.entries.push({ accountName: 'Retenciones IPOSTEL por Pagar', debit: 0, credit: financials.ipostel });
                if (financials.igtf > 0) asiento.entries.push({ accountName: 'IGTF por Pagar', debit: 0, credit: financials.igtf });

            } else { // Gasto
                const expense = t.originalDoc as Expense;
                const paymentMethod = paymentMethods.find(p => p.id === expense.paymentMethodId)?.name || 'Caja/Banco';
                asiento.description = `Compra según Factura ${expense.invoiceNumber || ''} de ${expense.supplierName}`;

                asiento.entries.push({ accountName: `Gasto - ${expense.category}`, debit: expense.taxableBase || expense.amount || 0, credit: 0 });
                if ((expense.vatAmount || 0) > 0) {
                     asiento.entries.push({ accountName: 'IVA Crédito Fiscal', debit: expense.vatAmount || 0, credit: 0 });
                }

                if (expense.status === 'Pagado') {
                    asiento.entries.push({ accountName: paymentMethod, debit: 0, credit: expense.amount });
                } else {
                    asiento.entries.push({ accountName: `Cuentas por Pagar - ${expense.supplierName}`, debit: 0, credit: expense.amount });
                }
            }
            generatedAsientos.push(asiento);
        });

        // 2. Process manual entries
        const manualAsientos = asientosManuales.map(manual => {
            const getAccountName = (id: string) => cuentasContables.find(c => c.id === id)?.nombre || 'Cuenta Desconocida';
            return {
                id: `manual-${manual.id}`,
                date: manual.fecha,
                description: manual.descripcion,
                entries: manual.entries.map(e => ({
                    accountName: getAccountName(e.cuentaId),
                    debit: e.debe,
                    credit: e.haber,
                })),
            };
        });

        // 3. Combine and sort
        const allAsientos = [...generatedAsientos, ...manualAsientos];
        return allAsientos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods]);

    const { paginatedData, currentPage, totalPages, setCurrentPage, totalItems } = usePagination(asientos, ITEMS_PER_PAGE);

    const totalDebits = asientos.reduce((sum, a) => sum + a.entries.reduce((s, e) => s + e.debit, 0), 0);
    const totalCredits = asientos.reduce((sum, a) => sum + a.entries.reduce((s, e) => s + e.credit, 0), 0);

    const handleExport = () => {
        const dataToExport: any[] = [];
        asientos.forEach(asiento => {
             asiento.entries.forEach((entry, entryIndex) => {
                 dataToExport.push({
                     'Fecha': entryIndex === 0 ? asiento.date : '',
                     'Descripción / Cuentas y Detalle': entry.credit > 0 ? `    ${entry.accountName}` : entry.accountName,
                     'Ref.': '',
                     'Debe (Bs.)': formatCurrencyForExport(entry.debit),
                     'Haber (Bs.)': formatCurrencyForExport(entry.credit),
                 });
             });
             dataToExport.push({ 'Descripción / Cuentas y Detalle': `Para registrar ${asiento.description}` });
        });
        
         if (dataToExport.length > 0) {
            dataToExport.push({}); // Empty row for spacing
            dataToExport.push({ 
                'Descripción / Cuentas y Detalle': "SUMAS IGUALES",
                'Debe (Bs.)': totalDebits,
                'Haber (Bs.)': totalCredits,
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Libro Diario");
        XLSX.writeFile(workbook, `Libro_Diario_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro Diario" size="4xl">
             <div className="flex justify-end mb-4">
                <Button onClick={handleExport} disabled={asientos.length === 0}>
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Exportar a Hoja de Cálculo
                </Button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Descripción de Cuentas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Debe</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Haber</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        {paginatedData.map((asiento) => (
                            <React.Fragment key={asiento.id}>
                                {asiento.entries.map((entry, entryIndex) => (
                                    <tr className={entryIndex === 0 ? "border-t-2 border-gray-300 dark:border-gray-600" : ""}>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm">
                                            {entryIndex === 0 ? asiento.date : ''}
                                        </td>
                                        <td className={`px-6 py-2 text-sm ${entry.credit > 0 ? 'pl-10' : 'font-medium'}`}>
                                            {entry.accountName}
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-mono">
                                            {formatCurrency(entry.debit)}
                                        </td>
                                        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-mono">
                                            {formatCurrency(entry.credit)}
                                        </td>
                                    </tr>
                                ))}
                                 <tr className="bg-gray-50 dark:bg-gray-800/50">
                                    <td className="px-6 py-2"></td>
                                    <td className="px-6 py-2 text-sm italic text-gray-500">
                                       Para registrar {asiento.description}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </React.Fragment>
                        ))}
                         {paginatedData.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No hay transacciones para mostrar.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold text-gray-800 dark:text-gray-200 sticky bottom-0">
                         <tr>
                            <td colSpan={2} className="px-6 py-3 text-left text-sm uppercase">Sumas Iguales</td>
                            <td className="px-6 py-3 text-right text-sm font-mono">{formatCurrency(totalDebits)}</td>
                            <td className="px-6 py-3 text-right text-sm font-mono">{formatCurrency(totalCredits)}</td>
                         </tr>
                    </tfoot>
                </table>
            </div>
            <PaginationControls 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
            />
        </Modal>
    );
};

export default LibroDiarioModal;