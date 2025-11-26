


import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Expense } from '../../types';
import { FileSpreadsheetIcon } from '../icons/Icons';

interface LibroDeComprasModalProps {
    isOpen: boolean;
    onClose: () => void;
    expenses: Expense[];
}

const formatCurrency = (amount: number = 0) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LibroDeComprasModal: React.FC<LibroDeComprasModalProps> = ({ isOpen, onClose, expenses }) => {
    
    // Filter for expenses that are relevant for the official SENIAT purchase ledger
    const fiscallyRelevantExpenses = useMemo(() => {
        return expenses.filter(exp => 
            exp.supplierRif && exp.supplierRif.toUpperCase() !== 'N/A' && exp.supplierRif.trim() !== '' &&
            exp.invoiceNumber && exp.invoiceNumber.toUpperCase() !== 'N/A' && exp.invoiceNumber.trim() !== ''
        );
    }, [expenses]);
    
    const sortedExpenses = [...fiscallyRelevantExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const totals = sortedExpenses.reduce((acc, exp) => {
        acc.total += exp.amount || 0;
        acc.base += exp.taxableBase || 0;
        acc.vat += exp.vatAmount || 0;
        return acc;
    }, { total: 0, base: 0, vat: 0 });

    const handleExport = () => {
        const dataToExport = sortedExpenses.map(exp => ({
            "Fecha": exp.date,
            "Nº Factura": exp.invoiceNumber,
            "Nº Control": exp.controlNumber,
            "Proveedor": exp.supplierName,
            "RIF Proveedor": exp.supplierRif,
            "Total Compra": exp.amount,
            "Base Imponible": exp.taxableBase,
            "IVA (16%)": exp.vatAmount,
        }));

        const totalsRow = {
            "Fecha": "",
            "Nº Factura": "",
            "Nº Control": "",
            "Proveedor": "TOTALES",
            "RIF Proveedor": "",
            "Total Compra": totals.total,
            "Base Imponible": totals.base,
            "IVA (16%)": totals.vat,
        };
        
        const finalData: any[] = [...dataToExport];
        if (dataToExport.length > 0) {
            finalData.push({});
            finalData.push(totalsRow);
        }

        const worksheet = XLSX.utils.json_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Libro_Compras");
        XLSX.writeFile(workbook, `Libro_de_Compras_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro de Compras (Formato SENIAT)" size="4xl">
            <div className="flex justify-end mb-4">
                <Button onClick={handleExport} disabled={sortedExpenses.length === 0}>
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Exportar a Excel
                </Button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nº Factura</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nº Control</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Proveedor</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">RIF</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Base</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">IVA</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedExpenses.map(exp => (
                            <tr key={exp.id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">{exp.date}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">{exp.invoiceNumber}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">{exp.controlNumber}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">{exp.supplierName}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">{exp.supplierRif}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-bold">{formatCurrency(exp.amount)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">{formatCurrency(exp.taxableBase)}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">{formatCurrency(exp.vatAmount)}</td>
                            </tr>
                        ))}
                         {sortedExpenses.length === 0 && (
                            <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No hay gastos con datos fiscales válidos para mostrar en el Libro de Compras.</td></tr>
                        )}
                    </tbody>
                    {sortedExpenses.length > 0 && (
                        <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-semibold text-gray-900 dark:text-gray-100 sticky bottom-0">
                            <tr>
                               <td colSpan={5} className="px-4 py-3 text-left text-sm">Totales</td>
                               <td className="px-4 py-3 text-right text-sm">{formatCurrency(totals.total)}</td>
                               <td className="px-4 py-3 text-right text-sm">{formatCurrency(totals.base)}</td>
                               <td className="px-4 py-3 text-right text-sm">{formatCurrency(totals.vat)}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </Modal>
    );
};

export default LibroDeComprasModal;