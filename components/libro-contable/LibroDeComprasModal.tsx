


import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Expense } from '../../types';
import { FileSpreadsheetIcon, BookOpenIcon } from '../icons/Icons';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

interface LibroDeComprasModalProps {
    isOpen: boolean;
    onClose: () => void;
    expenses: Expense[];
}

const ITEMS_PER_PAGE = 20;

const formatCurrency = (amount: number = 0) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LibroDeComprasModal: React.FC<LibroDeComprasModalProps> = ({ isOpen, onClose, expenses }) => {
    
    const fiscallyRelevantExpenses = useMemo(() => {
        return expenses.filter(exp => 
            exp.supplierRif && exp.supplierRif.toUpperCase() !== 'N/A' && exp.supplierRif.trim() !== '' &&
            exp.invoiceNumber && exp.invoiceNumber.toUpperCase() !== 'N/A' && exp.invoiceNumber.trim() !== ''
        );
    }, [expenses]);
    
    const sortedExpenses = [...fiscallyRelevantExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const { paginatedData, currentPage, totalPages, setCurrentPage, totalItems } = usePagination(sortedExpenses, ITEMS_PER_PAGE);
    
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                        Registro de Compras y Gastos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detalle de todas las compras con datos fiscales válidos para declaraciones.
                    </p>
                </div>
                <Button onClick={handleExport} disabled={sortedExpenses.length === 0} className="shrink-0">
                    <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                    Exportar a Excel
                </Button>
            </div>
            
            <div className="overflow-x-auto max-h-[65vh] border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Factura</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Control</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Proveedor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">RIF</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">Total</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">Base</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">IVA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length > 0 ? (
                            paginatedData.map(exp => (
                                <tr key={exp.id} className="odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{exp.date}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{exp.invoiceNumber}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{exp.controlNumber}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-black">{exp.supplierName}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black font-mono">{exp.supplierRif}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-semibold text-black font-mono">{formatCurrency(exp.amount)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-mono">{formatCurrency(exp.taxableBase)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-black font-mono">{formatCurrency(exp.vatAmount)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center bg-white dark:bg-gray-900">
                                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No hay compras para mostrar</h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Este reporte fiscal solo incluye gastos que tengan un <strong className="text-gray-700 dark:text-gray-300">RIF de proveedor</strong> y un <strong className="text-gray-700 dark:text-gray-300">Número de Factura</strong>.
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Por favor, asegúrese de registrar estos datos al añadir o editar un gasto.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {sortedExpenses.length > 0 && (
                        <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-semibold text-black sticky bottom-0">
                            <tr>
                               <td colSpan={5} className="px-4 py-3 text-left text-sm text-black">Totales</td>
                               <td className="px-4 py-3 text-right text-sm text-black">{formatCurrency(totals.total)}</td>
                               <td className="px-4 py-3 text-right text-sm text-black">{formatCurrency(totals.base)}</td>
                               <td className="px-4 py-3 text-right text-sm text-black">{formatCurrency(totals.vat)}</td>
                            </tr>
                        </tfoot>
                    )}
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

export default LibroDeComprasModal;