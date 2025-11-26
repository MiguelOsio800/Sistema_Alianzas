
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Transaction } from './LibroContableView';
import { Invoice, Expense, CompanyInfo, PaymentMethod, AsientoManual, CuentaContable } from '../../types';
import { calculateFinancialDetails } from '../../utils/financials';
import { FileSpreadsheetIcon } from '../icons/Icons';
import Select from '../ui/Select';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

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

interface LibroAuxiliarModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactions: Transaction[];
    asientosManuales: AsientoManual[];
    cuentasContables: CuentaContable[];
    companyInfo: CompanyInfo;
    paymentMethods: PaymentMethod[];
}

const ITEMS_PER_PAGE = 25;

const formatCurrency = (amount: number, forExport = false) => {
    if (forExport) {
        return amount !== 0 ? amount : null;
    }
    const formatted = amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount !== 0 ? `Bs. ${formatted}` : '';
};


const LibroAuxiliarModal: React.FC<LibroAuxiliarModalProps> = ({ isOpen, onClose, transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods }) => {
    const [selectedAccount, setSelectedAccount] = useState('');

    const { accountList, ledgerData, dateRange } = useMemo(() => {
        if (transactions.length === 0 && asientosManuales.length === 0) {
            return { accountList: [], ledgerData: null, dateRange: '' };
        }
        
        let minDate: Date | null = null;
        let maxDate: Date | null = null;

        // Step 1: Generate journal entries (asientos)
        const allAsientos: Asiento[] = [];
        transactions.forEach(t => {
            const currentDate = new Date(t.date + 'T00:00:00');
            if (!minDate || currentDate < minDate) minDate = currentDate;
            if (!maxDate || currentDate > maxDate) maxDate = currentDate;

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
            const currentDate = new Date(manual.fecha + 'T00:00:00');
            if (!minDate || currentDate < minDate) minDate = currentDate;
            if (!maxDate || currentDate > maxDate) maxDate = currentDate;
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
            
        const calculatedDateRange = minDate && maxDate 
            ? `Desde: ${minDate.toLocaleDateString('es-VE')} - Hasta: ${maxDate.toLocaleDateString('es-VE')}`
            : 'Período no definido';
            
        const allAccountNames = new Set<string>();
        allAsientos.forEach(a => a.entries.forEach(e => allAccountNames.add(e.accountName)));
        const sortedAccountList = Array.from(allAccountNames).sort();

        if (!selectedAccount) {
            return { accountList: sortedAccountList, ledgerData: null, dateRange: calculatedDateRange };
        }
        
        const accountMovements = allAsientos
            .flatMap(asiento => 
                asiento.entries
                    .filter(entry => entry.accountName === selectedAccount)
                    .map(entry => ({
                        date: asiento.date,
                        description: asiento.description,
                        debit: entry.debit,
                        credit: entry.credit
                    }))
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        let totalDebit = 0;
        let totalCredit = 0;
        const entriesWithBalance: LedgerEntry[] = [];

        accountMovements.forEach(entry => {
            runningBalance += entry.debit - entry.credit;
            totalDebit += entry.debit;
            totalCredit += entry.credit;
            entriesWithBalance.push({ ...entry, balance: runningBalance });
        });
        
        const finalLedgerData = {
            accountName: selectedAccount,
            entries: entriesWithBalance,
            totalDebit,
            totalCredit,
            finalBalance: runningBalance
        };

        return { accountList: sortedAccountList, ledgerData: finalLedgerData, dateRange: calculatedDateRange };

    }, [transactions, asientosManuales, cuentasContables, companyInfo, paymentMethods, selectedAccount]);
    
    const { paginatedData, currentPage, totalPages, setCurrentPage, totalItems } = usePagination(
        ledgerData ? ledgerData.entries : [],
        ITEMS_PER_PAGE
    );

    const handleExport = () => {
        if (!ledgerData) return;
        
        const header = [
            { A: companyInfo.name, B: '', C: '', D: '', E: '' },
            { A: `RIF: ${companyInfo.rif}`, B: '', C: '', D: '', E: '' },
            { A: '', B: '', C: '', D: '', E: '' },
            { A: 'LIBRO AUXILIAR', B: '', C: '', D: '', E: '' },
            { A: `Cuenta: ${ledgerData.accountName}`, B: '', C: '', D: '', E: '' },
            { A: `Período: ${dateRange}`, B: '', C: '', D: '', E: '' },
            { A: '', B: '', C: '', D: '', E: '' },
        ];
        
        const wsHeader = XLSX.utils.json_to_sheet(header, {skipHeader: true});
        
        wsHeader['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
            { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
            { s: { r: 5, c: 0 }, e: { r: 5, c: 4 } },
        ];
        
        const dataToExport = ledgerData.entries.map(entry => ({
            "Fecha": entry.date,
            "Descripción": entry.description,
            "Debe": formatCurrency(entry.debit, true),
            "Haber": formatCurrency(entry.credit, true),
            "Saldo": formatCurrency(entry.balance, true)
        }));

        const totalsRow = {
            "Fecha": "",
            "Descripción": "TOTALES",
            "Debe": formatCurrency(ledgerData.totalDebit, true),
            "Haber": formatCurrency(ledgerData.totalCredit, true),
            "Saldo": formatCurrency(ledgerData.finalBalance, true)
        };
        
        const ws = XLSX.utils.sheet_add_json(wsHeader, [...dataToExport, totalsRow], { origin: 'A8'});
        
        ws['!cols'] = [{wch:12}, {wch:50}, {wch:15}, {wch:15}, {wch:15}];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, ws, `Auxiliar - ${ledgerData.accountName.substring(0,20)}`);
        XLSX.writeFile(workbook, `Libro_Auxiliar_${ledgerData.accountName.replace(/ /g, '_')}.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro Auxiliar por Cuenta" size="4xl">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-full sm:w-2/3">
                    <Select label="Seleccione una Cuenta Contable" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}>
                        <option value="">-- Seleccionar --</option>
                        {accountList.map(name => <option key={name} value={name}>{name}</option>)}
                    </Select>
                </div>
                <Button onClick={handleExport} disabled={!ledgerData}>
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Exportar Vista
                </Button>
            </div>
            
            <div className="overflow-x-auto max-h-[60vh] border dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-800">
                {ledgerData ? (
                    <div>
                        <div id="report-header" className="mb-4 text-center text-gray-800 dark:text-gray-200">
                            <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                            <p className="text-sm">RIF: {companyInfo.rif}</p>
                            <h3 className="text-lg font-semibold mt-2">LIBRO AUXILIAR</h3>
                            <p className="font-semibold">{ledgerData.accountName}</p>
                            <p className="text-xs text-gray-500">{dateRange}</p>
                        </div>
                        <table className="min-w-full">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Descripción</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Debe</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Haber</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-800 dark:text-gray-200 uppercase">Saldo</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800 dark:text-gray-200">
                                {paginatedData.map((entry, index) => (
                                    <tr key={index} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{entry.date}</td>
                                        <td className="px-4 py-2 text-sm">{entry.description}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono">{formatCurrency(entry.debit)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono">{formatCurrency(entry.credit)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-mono font-semibold">{formatCurrency(entry.balance, true)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold text-gray-800 dark:text-gray-200">
                                <tr className="border-t-2 border-gray-300 dark:border-gray-500">
                                    <td colSpan={2} className="px-4 py-2 text-left text-sm uppercase">Totales</td>
                                    <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(ledgerData.totalDebit, true)}</td>
                                    <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(ledgerData.totalCredit, true)}</td>
                                    <td className="px-4 py-2 text-right text-sm font-mono">{formatCurrency(ledgerData.finalBalance, true)}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <PaginationControls 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={totalItems}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {accountList.length > 0 ? 'Por favor, seleccione una cuenta para ver su detalle.' : 'No hay transacciones con los filtros actuales para generar el libro auxiliar.'}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default LibroAuxiliarModal;
