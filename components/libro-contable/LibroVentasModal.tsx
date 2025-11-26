


import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Invoice, CompanyInfo } from '../../types';
import { FileSpreadsheetIcon, BookOpenIcon } from '../icons/Icons';
import { calculateFinancialDetails } from '../../utils/financials';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

interface LibroVentasModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoices: Invoice[];
    companyInfo: CompanyInfo;
}

const ITEMS_PER_PAGE = 20;

const formatCurrency = (amount: number = 0) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LibroVentasModal: React.FC<LibroVentasModalProps> = ({ isOpen, onClose, invoices, companyInfo }) => {

    const sortedInvoices = useMemo(() => {
        return [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [invoices]);
    
    const { paginatedData, currentPage, totalPages, setCurrentPage, totalItems } = usePagination(sortedInvoices, ITEMS_PER_PAGE);

    const totals = useMemo(() => {
        return sortedInvoices.reduce((acc, inv) => {
            if (inv.status !== 'Anulada') {
                const financials = calculateFinancialDetails(inv.guide, companyInfo);
                acc.total += financials.total;
                acc.base += financials.subtotal;
                acc.vat += financials.iva;
                acc.ipostel += financials.ipostel;
            }
            return acc;
        }, { total: 0, base: 0, vat: 0, ipostel: 0 });
    }, [sortedInvoices, companyInfo]);
    
    const handleExport = () => {
        const dataToExport = sortedInvoices.map(inv => {
            if (inv.status === 'Anulada') {
                return {
                    "Fecha": inv.date,
                    "Nº Factura": inv.invoiceNumber,
                    "Nº Control": inv.controlNumber,
                    "Cliente": inv.clientName,
                    "RIF Cliente": inv.clientIdNumber,
                    "Total Venta": "ANULADA",
                    "Base Imponible": 0,
                    "IVA (16%)": 0,
                    "IPOSTEL": 0,
                };
            }
            const financials = calculateFinancialDetails(inv.guide, companyInfo);
            return {
                "Fecha": inv.date,
                "Nº Factura": inv.invoiceNumber,
                "Nº Control": inv.controlNumber,
                "Cliente": inv.clientName,
                "RIF Cliente": inv.clientIdNumber,
                "Total Venta": financials.total,
                "Base Imponible": financials.subtotal,
                "IVA (16%)": financials.iva,
                "IPOSTEL": financials.ipostel,
            };
        });

        const totalsRow = {
            "Fecha": "",
            "Nº Factura": "",
            "Nº Control": "",
            "Cliente": "TOTALES",
            "RIF Cliente": "",
            "Total Venta": totals.total,
            "Base Imponible": totals.base,
            "IVA (16%)": totals.vat,
            "IPOSTEL": totals.ipostel,
        };
        
        const finalData: any[] = [...dataToExport];
        if (dataToExport.length > 0) {
            finalData.push({});
            finalData.push(totalsRow);
        }

        const worksheet = XLSX.utils.json_to_sheet(finalData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Libro_Ventas");
        XLSX.writeFile(workbook, `Libro_de_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Libro de Ventas (Formato SENIAT)" size="4xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Registro de Ventas e Ingresos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detalle de todas las ventas emitidas para declaraciones.
                    </p>
                </div>
                <Button onClick={handleExport} disabled={sortedInvoices.length === 0} className="shrink-0">
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
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">RIF</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">Total</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">Base</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">IVA</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wider">IPOSTEL</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length > 0 ? (
                            paginatedData.map(inv => {
                                const financials = inv.status !== 'Anulada' ? calculateFinancialDetails(inv.guide, companyInfo) : null;
                                return (
                                    <tr key={inv.id} className={`odd:bg-white dark:odd:bg-gray-900 even:bg-gray-50 dark:even:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/50 ${inv.status === 'Anulada' ? 'text-red-500 dark:text-red-600 line-through' : 'text-black'}`}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{inv.date}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{inv.invoiceNumber}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-black">{inv.controlNumber}</td>
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${inv.status !== 'Anulada' ? 'text-black' : ''}`}>{inv.clientName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-black">{inv.clientIdNumber}</td>
                                        <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-semibold font-mono ${inv.status !== 'Anulada' ? 'text-black' : ''}`}>
                                            {inv.status === 'Anulada' ? 'ANULADA' : formatCurrency(financials?.total)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-mono text-black">{financials ? formatCurrency(financials.subtotal) : '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-mono text-black">{financials ? formatCurrency(financials.iva) : '-'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-mono text-black">{financials ? formatCurrency(financials.ipostel) : '-'}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center bg-white dark:bg-gray-900">
                                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No hay ventas para mostrar</h3>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        Filtre por un rango de fechas para ver las facturas emitidas.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {sortedInvoices.length > 0 && (
                        <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0">
                            <tr>
                               <td colSpan={5} className="px-4 py-3 text-left text-sm uppercase tracking-wider text-black">Totales</td>
                               <td className="px-4 py-3 text-right text-sm font-mono text-black">{formatCurrency(totals.total)}</td>
                               <td className="px-4 py-3 text-right text-sm font-mono text-black">{formatCurrency(totals.base)}</td>
                               <td className="px-4 py-3 text-right text-sm font-mono text-black">{formatCurrency(totals.vat)}</td>
                               <td className="px-4 py-3 text-right text-sm font-mono text-black">{formatCurrency(totals.ipostel)}</td>
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

export default LibroVentasModal;