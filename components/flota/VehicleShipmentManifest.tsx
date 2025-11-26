

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, Vehicle, Office, Client, CompanyInfo } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DownloadIcon, XIcon } from '../icons/Icons';
import { calculateFinancialDetails } from '../../utils/financials';

interface VehicleShipmentManifestProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: Vehicle;
    invoices: Invoice[];
    offices: Office[];
    clients: Client[];
    companyInfo: CompanyInfo;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const VehicleShipmentManifest: React.FC<VehicleShipmentManifestProps> = ({
    isOpen, onClose, vehicle, invoices, offices, clients, companyInfo
}) => {
    if (!isOpen) return null;

    const getOfficeName = (officeId: string) => offices.find(o => o.id === officeId)?.name || officeId;
    const getClient = (clientRef: Partial<Client>) => {
        if (!clientRef) return null;
        return clients.find(c => c.id === clientRef.id || (clientRef.idNumber && c.idNumber === clientRef.idNumber));
    };

    const handleDownloadPdf = () => {
        const input = document.getElementById('manifest-to-print');
        if (!input) return;

        html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let imgHeight = pdfWidth / ratio;
            let heightLeft = imgHeight;
            let position = 0;
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;
            }
            
            pdf.save(`remesa_vehiculo_${vehicle.placa}.pdf`);
        });
    };

    const manifestTotals = invoices.reduce((acc, inv) => {
        const financials = calculateFinancialDetails(inv.guide, companyInfo);
        const totalPackages = inv.guide.merchandise.reduce((sum, m) => sum + m.quantity, 0);
        
        acc.packages += totalPackages;
        acc.amount += inv.totalAmount;
        acc.iva += financials.iva;
        acc.ipostel += financials.ipostel;

        return acc;
    }, { packages: 0, amount: 0, iva: 0, ipostel: 0 });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Remesa de Carga - Vehículo ${vehicle.placa}`} size="4xl">
            <div id="manifest-to-print" className="bg-white text-black p-4 md:p-6">
                <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h1 className="text-xl font-bold text-black">{companyInfo.name}</h1>
                        <p className="text-xs text-black">RIF: {companyInfo.rif}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-extrabold uppercase text-black">MANIFIESTO DE RUTA Y CARGA</h2>
                        <p className="text-sm font-mono text-black"><strong>Fecha:</strong> {new Date().toLocaleDateString('es-VE')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mt-4 text-sm border p-2 rounded-md">
                    <div className="text-black"><strong className="block text-gray-500 text-xs">VEHÍCULO:</strong> {vehicle.modelo}</div>
                    <div className="text-black"><strong className="block text-gray-500 text-xs">PLACA:</strong> {vehicle.placa}</div>
                    <div className="text-black"><strong className="block text-gray-500 text-xs">CONDUCTOR:</strong> {vehicle.driver}</div>
                    <div className="text-black"><strong className="block text-gray-500 text-xs">C.I / RIF:</strong> No disponible</div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-xs border-t border-b">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-2 py-2 text-left font-semibold text-black">FACTURA</th>
                                <th className="px-2 py-2 text-left font-semibold text-black">DESTINATARIO</th>
                                <th className="px-2 py-2 text-left font-semibold text-black">DESCRIPCIÓN</th>
                                <th className="px-2 py-2 text-center font-semibold text-black">PAQ.</th>
                                <th className="px-2 py-2 text-right font-semibold text-black">IPOSTEL</th>
                                <th className="px-2 py-2 text-right font-semibold text-black">IVA</th>
                                <th className="px-2 py-2 text-right font-semibold text-black">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {invoices.map(invoice => {
                                const receiver = getClient(invoice.guide.receiver);
                                const financials = calculateFinancialDetails(invoice.guide, companyInfo);
                                const description = invoice.guide.merchandise.map(m => `${m.quantity}x ${m.description}`).join(', ');
                                const totalPackages = invoice.guide.merchandise.reduce((acc, m) => acc + m.quantity, 0);

                                return (
                                    <tr key={invoice.id} className="text-black">
                                        <td className="px-2 py-1 font-mono text-black">{invoice.invoiceNumber}</td>
                                        <td className="px-2 py-1 text-black">{receiver?.name}</td>
                                        <td className="px-2 py-1 whitespace-normal max-w-xs truncate text-black" title={description}>{description}</td>
                                        <td className="px-2 py-1 text-center text-black">{totalPackages}</td>
                                        <td className="px-2 py-1 text-right text-black">{financials.ipostel.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-2 py-1 text-right text-black">{financials.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-2 py-1 text-right font-semibold text-black">{invoice.totalAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                            <tr>
                                <td className="px-2 py-2 text-black" colSpan={3}>TOTALES</td>
                                <td className="px-2 py-2 text-center text-black">{manifestTotals.packages}</td>
                                <td className="px-2 py-2 text-right text-black">{formatCurrency(manifestTotals.ipostel)}</td>
                                <td className="px-2 py-2 text-right text-black">{formatCurrency(manifestTotals.iva)}</td>
                                <td className="px-2 py-2 text-right text-black">{formatCurrency(manifestTotals.amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="mt-16 pt-8">
                    <div className="grid grid-cols-2 gap-8 text-center text-sm">
                        <div>
                            <p className="border-t border-black pt-1 text-black">{vehicle.driver}</p>
                            <p className="font-semibold text-black">Conductor</p>
                        </div>
                        <div>
                            <p className="border-t border-black pt-1 text-black">_________________________</p>
                            <p className="font-semibold text-black">Despachador</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700 no-print">
                <Button type="button" variant="secondary" onClick={onClose}>
                    <XIcon className="w-4 h-4 mr-2" />Cerrar
                </Button>
                <Button type="button" onClick={handleDownloadPdf}>
                    <DownloadIcon className="w-4 h-4 mr-2" />Descargar PDF
                </Button>
            </div>
        </Modal>
    );
};

export default VehicleShipmentManifest;