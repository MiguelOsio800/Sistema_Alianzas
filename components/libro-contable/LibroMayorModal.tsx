

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Transaction } from './LibroContableView';
import { Invoice, Expense, CompanyInfo, PaymentMethod, AsientoManual, CuentaContable } from '../../types';
import { calculateFinancialDetails } from '../../utils/financials';
import { FileSpreadsheetIcon, ChevronDownIcon } from '../icons/Icons';

interface AsientoEntry {
    accountName: string;
    debit: number;
    credit: number;
}
interface Asiento {
    id: string;
    date: string;
    description: string;
    entries: AsientoEntry[];
}

interface LedgerEntry {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}
interface LedgerAccount {
    accountName: string;
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    finalBalance: number;
}
type Ledger = Record<string, LedgerAccount>;


interface LibroMayorModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    asientosManuales: AsientoManual[];
    cuentasContables: CuentaContable[];
    companyInfo: CompanyInfo;
    paymentMethods: PaymentMethod[];
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LibroMayorModal: React.FC<LibroMayorModalProps> = ({ isOpen, onClose, transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods }) => {
    const [openAccount, setOpenAccount] = useState<string | null>(null);

    const ledger = useMemo((): Ledger => {
        // Step 1: Generate journal entries (asientos) from all sources
        const allAsientos: Asiento[] = [];
        transactions.forEach(t => {
            const asiento: Asiento = { id: t.id, date: t.date, description: '', entries: [] };
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
                
                if (invoice.guide.paymentType === 'flete-destino' && invoice.paymentStatus === 'Pagada') {
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
            } else {
                const expense = t.originalDoc as Expense;
                const paymentMethod = paymentMethods.find(p => p.id === expense.paymentMethodId)?.name || 'Caja/Banco';
                asiento.description = `Compra s/g Factura ${expense.invoiceNumber || ''} de ${expense.supplierName}`;
                asiento.entries.push({ accountName: `Gasto - ${expense.category}`, debit: expense.taxableBase || expense.amount || 0, credit: 0 });
                if ((expense.vatAmount || 0) > 0) asiento.entries.push({ accountName: 'IVA Crédito Fiscal', debit: expense.vatAmount || 0, credit: 0 });
                if (expense.status === 'Pagado') {
                    asiento.entries.push({ accountName: paymentMethod, debit: 0, credit: expense.amount });
                } else {
                    asiento.entries.push({ accountName: `Cuentas por Pagar - ${expense.supplierName}`, debit: 0, credit: expense.amount });
                }
            }
            allAsientos.push(asiento);
        });

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
        allAsientos.push(...manualAsientos);


        // Step 2: Process asientos into ledger format
        const groupedByAccount: Record<string, { date: string, description: string, debit: number, credit: number }[]> = {};
        allAsientos.forEach(asiento => {
            asiento.entries.forEach(entry => {
                if (!groupedByAccount[entry.accountName]) {
                    groupedByAccount[entry.accountName] = [];
                }
                groupedByAccount[entry.accountName].push({
                    date: asiento.date,
                    description: asiento.description,
                    debit: entry.debit,
                    credit: entry.credit,
                });
            });
        });

        // Step 3: Calculate running balances and totals
        const finalLedger: Ledger = {};
        Object.keys(groupedByAccount).sort().forEach(accountName => {
            const sortedEntries = groupedByAccount[accountName].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            let runningBalance = 0;
            const entriesWithBalance: LedgerEntry[] = [];
            let totalDebit = 0;
            let totalCredit = 0;

            sortedEntries.forEach(entry => {
                runningBalance += entry.debit - entry.credit;
                totalDebit += entry.debit;
                totalCredit += entry.credit;
                entriesWithBalance.push({ ...entry, balance: runningBalance });
            });
            
            finalLedger[accountName] = {
                accountName,
                entries: entriesWithBalance,
                totalDebit,
                totalCredit,
                finalBalance: runningBalance
            };
        });

        return finalLedger;
    }, [transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods]);

    const handleToggleAccount = (accountName: string) => {
        setOpenAccount(prev => (prev === accountName ? null : accountName));
    };

    const handleExport = () => {
        const sheetData: any[][] = [];
        Object.values(ledger).forEach((account: LedgerAccount) => {
            sheetData.push([account.accountName]); // Account Title
            sheetData.push(["Fecha", "Descripción", "Debe", "Haber", "Saldo"]); // Headers
            account.entries.forEach(entry => {
                sheetData.push([
                    entry.date,
                    entry.description,
                    entry.debit || null,
                    entry.credit || null,
                    entry.balance
                ]);
            });
            sheetData.push([
                "", "TOTALES", account.totalDebit, account.totalCredit, account.finalBalance
            ]);
            sheetData.push([]); // Empty row for spacing
        });

        if (sheetData.length > 0) {
             const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
             worksheet['!cols'] = [{wch:15}, {wch:40}, {wch:15}, {wch:15}, {wch:15}];

             const workbook = XLSX.utils.book_new();
             XLSX.utils.book_append_sheet(workbook, worksheet, "Libro Mayor");
             XLSX.writeFile(workbook, `Libro_Mayor_${new Date().toISOString().split('T')[0]}.xlsx`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro Mayor General" size="4xl">
            <div className="flex justify-end mb-4">
                <Button onClick={handleExport} disabled={Object.keys(ledger).length === 0}>
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Exportar a Hoja de Cálculo
                </Button>
            </div>
            <div className="overflow-y-auto max-h-[70vh] space-y-2 pr-2">
                {Object.keys(ledger).length > 0 ? Object.values(ledger).map((account: LedgerAccount) => {
                    const isOpen = openAccount === account.accountName;
                    return (
                        <div key={account.accountName} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <button
                                onClick={() => handleToggleAccount(account.accountName)}
                                className="w-full p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex justify-between items-center"
                            >
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{account.accountName}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono text-gray-600 dark:text-gray-400">Saldo: {formatCurrency(account.finalBalance)}</span>
                                    <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isOpen && (
                                <div className="bg-white dark:bg-gray-800/50 p-2 overflow-x-auto">
                                     <table className="min-w-full">
                                         <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-800 dark:text-gray-200 uppercase">Fecha</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-800 dark:text-gray-200 uppercase">Descripción</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200 uppercase">Debe</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200 uppercase">Haber</th>
                                                <th className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200 uppercase">Saldo</th>
                                            </tr>
                                         </thead>
                                         <tbody className="text-gray-800 dark:text-gray-200">
                                            {account.entries.map((entry, index) => (
                                                <tr key={index} className="border-t dark:border-gray-700">
                                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.date}</td>
                                                    <td className="px-4 py-2 text-sm">{entry.description}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono">{entry.debit > 0 ? formatCurrency(entry.debit) : ''}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono">{entry.credit > 0 ? formatCurrency(entry.credit) : ''}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono font-semibold">{formatCurrency(entry.balance)}</td>
                                                </tr>
                                            ))}
                                         </tbody>
                                         <tfoot className="bg-gray-100 dark:bg-gray-900/50 font-bold text-gray-800 dark:text-gray-200">
                                             <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                                                 <td colSpan={2} className="px-4 py-2 text-left text-sm uppercase">Totales Cuenta</td>
                                                 <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(account.totalDebit)}</td>
                                                 <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(account.totalCredit)}</td>
                                                 <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(account.finalBalance)}</td>
                                             </tr>
                                         </tfoot>
                                     </table>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                     <p className="text-center py-12 text-gray-500 dark:text-gray-400">No hay transacciones para mostrar.</p>
                )}
            </div>
        </Modal>
    );
};

export default LibroMayorModal;