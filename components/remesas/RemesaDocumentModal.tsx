

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Remesa, Invoice, Asociado, Vehicle, Client, CompanyInfo, Office, Category, Merchandise } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { DownloadIcon, XIcon } from '../icons/Icons';
import { calculateFinancialDetails } from '../../utils/financials';


interface RemesaDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    remesa: Remesa;
    invoices: Invoice[];
    asociados: Asociado[];
    vehicles: Vehicle[];
    clients: Client[];
    companyInfo: CompanyInfo;
    offices: Office[];
    categories: Category[];
}

// Main Component
const RemesaDocumentModal: React.FC<RemesaDocumentModalProps> = ({
    isOpen, onClose, remesa, invoices, asociados, vehicles, clients, companyInfo, offices
}) => {

    const formatDocCurrency = (amount: number) => amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const handleDownloadPdf = () => {
        const input = document.getElementById('remesa-to-print');
        if (!input) {
            console.error("Printable area not found!");
            return;
        };

        const originalBackgroundColor = input.style.backgroundColor;
        input.style.backgroundColor = 'white';
        
        // Temporarily set all text to black for canvas rendering
        const elements = input.querySelectorAll('*');
        const originalColors = new Map<HTMLElement, string>();
        elements.forEach(el => {
            const htmlEl = el as HTMLElement;
            originalColors.set(htmlEl, htmlEl.style.color);
            htmlEl.style.color = 'black';
        });

        html2canvas(input, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            windowWidth: input.scrollWidth,
            windowHeight: input.scrollHeight
        }).then(canvas => {
            // Restore original styles
            input.style.backgroundColor = originalBackgroundColor;
            elements.forEach(el => {
                 const htmlEl = el as HTMLElement;
                htmlEl.style.color = originalColors.get(htmlEl) || '';
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            
            const ratio = canvasWidth / canvasHeight;
            const imgHeight = pdfWidth / ratio;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdfHeight;
            }
            
            pdf.save(`remesa_${remesa.remesaNumber}.pdf`);
        });
    };

    if (!isOpen) return null;

    const asociado = asociados.find(a => a.id === remesa.asociadoId);
    const vehicle = vehicles.find(v => v.id === remesa.vehicleId);
    const remesaInvoices = invoices.filter(inv => remesa.invoiceIds.includes(inv.id));

    const firstInvoice = remesaInvoices[0];
    const originOffice = firstInvoice ? offices.find(o => o.id === firstInvoice.guide.originOfficeId) : null;
    const sucursalText = originOffice ? `${originOffice.code}-${originOffice.name.split(' - ')[0].toUpperCase()}` : 'SUCURSAL DESCONOCIDA';

    const getOfficeName = (officeId: string) => offices.find(o => o.id === officeId)?.name || officeId;
    
    const groupedInvoices = remesaInvoices.reduce((acc: Record<string, Invoice[]>, inv: Invoice) => {
        const officeName = getOfficeName(inv.guide.destinationOfficeId);
        if (!acc[officeName]) {
            acc[officeName] = [];
        }
        acc[officeName].push(inv);
        return acc;
    }, {});
    
    const tableTotals = remesaInvoices.reduce((acc, inv: Invoice) => {
        const financials = calculateFinancialDetails(inv.guide, companyInfo);
        acc.flete += financials.freight;
        acc.seguro += financials.insuranceCost;
        acc.total += financials.total;
        acc.piezas += inv.guide.merchandise.reduce((sum, m: Merchandise) => sum + m.quantity, 0);
        return acc;
    }, { flete: 0, seguro: 0, total: 0, piezas: 0 });

    const initialSummary = {
        flete: 0, seguro: 0, ipostel: 0, manejo: 0,
    };

    const { pagadoTotals, destinoTotals } = remesaInvoices.reduce((acc, inv: Invoice) => {
        const financials = calculateFinancialDetails(inv.guide, companyInfo);
        const target = inv.guide.paymentType === 'flete-pagado' ? acc.pagadoTotals : acc.destinoTotals;
        
        target.flete += financials.freight;
        target.seguro += financials.insuranceCost;
        target.ipostel += financials.ipostel;
        target.manejo += financials.handling;
        
        return acc;
    }, { pagadoTotals: {...initialSummary}, destinoTotals: {...initialSummary} });

    const totalFleteGeneral = pagadoTotals.flete + destinoTotals.flete;

    const fletePagadoAsociado = pagadoTotals.flete * 0.75;
    const subTotalPagado = fletePagadoAsociado - pagadoTotals.seguro - pagadoTotals.ipostel - pagadoTotals.manejo;

    const retencionFleteDestino = destinoTotals.flete * 0.25;
    const totalARetener = retencionFleteDestino + destinoTotals.seguro + destinoTotals.ipostel + destinoTotals.manejo;

    const totalALiquidar = subTotalPagado - totalARetener;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Remesa de Carga - ${remesa.remesaNumber}`} size="4xl">
            <div id="remesa-to-print" className="bg-white text-black font-sans text-xs printable-area">
                {/* Header */}
                <header className="flex justify-between items-start border-b-2 border-black pb-2 text-black">
                    <div className="flex items-center">
                        {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="Logo" className="h-16 w-auto mr-4" />}
                        <div>
                            <p className="font-bold text-sm text-black">Asociación Cooperativa Mixta</p>
                            <p className="font-bold text-sm text-black">FRATERNIDAD DEL TRANSPORTE, R.L.</p>
                            <p className="text-black">RIF: {companyInfo.rif}</p>
                        </div>
                    </div>
                    <div className="text-right text-black">
                        <h1 className="font-bold text-2xl text-black">REMESA DE CARGA</h1>
                        <p className="text-black"><strong>Nº Liquidación:</strong> {remesa.remesaNumber}</p>
                        <p className="text-black"><strong>Emisión:</strong> {new Date(remesa.date + 'T00:00:00').toLocaleDateString('es-VE', { timeZone: 'UTC' })}</p>
                    </div>
                </header>

                {/* Info Block */}
                <section className="mt-4 grid grid-cols-3 gap-x-4 gap-y-2 border border-black p-2 rounded-md text-[11px] text-black">
                    <div className="border-r border-black pr-2 text-black"><strong>SUCURSAL ORIGEN:</strong> {sucursalText}</div>
                    <div className="border-r border-black pr-2 text-black"><strong>ASOCIADO:</strong> {asociado?.nombre} ({asociado?.codigo})</div>
                    <div className="text-black"><strong>VEHÍCULO:</strong> {vehicle?.modelo} ({vehicle?.placa})</div>
                </section>

                {/* Invoices Table */}
                <section className="mt-4">
                    <table className="w-full border-collapse text-black">
                        <thead className="border-y-2 border-black font-bold bg-gray-200">
                            <tr>
                                <th className="p-1 text-left text-black">FACTURA</th>
                                <th className="p-1 text-left text-black">TIPO</th>
                                <th className="p-1 text-center text-black">PZAS</th>
                                <th className="p-1 text-left text-black">EMISIÓN</th>
                                <th className="p-1 text-left text-black">RECEPTOR</th>
                                <th className="p-1 text-right text-black">FLETE</th>
                                <th className="p-1 text-right text-black">SEGURO</th>
                                <th className="p-1 text-right text-black">TOTAL ENVÍO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedInvoices).map(([officeName, invoicesInGroup]: [string, Invoice[]]) => {
                                const groupTotals = invoicesInGroup.reduce((acc, inv: Invoice) => {
                                    const financials = calculateFinancialDetails(inv.guide, companyInfo);
                                    acc.flete += financials.freight;
                                    acc.seguro += financials.insuranceCost;
                                    acc.total += financials.total;
                                    return acc;
                                }, { flete: 0, seguro: 0, total: 0 });

                                return (
                                    <React.Fragment key={officeName}>
                                        <tr className="bg-gray-100"><td colSpan={8} className="p-1 font-bold text-black">DESTINO: {officeName.toUpperCase()}</td></tr>
                                        {invoicesInGroup.map((inv: Invoice) => {
                                            const financials = calculateFinancialDetails(inv.guide, companyInfo);
                                            const totalPackages = inv.guide.merchandise.reduce((acc, m: Merchandise) => acc + m.quantity, 0);
                                            const receiver = clients.find(c => c.id === inv.guide.receiver.id || (c.idNumber && c.idNumber === inv.guide.receiver.idNumber)) || inv.guide.receiver;
                                            const paymentType = inv.guide.paymentType === 'flete-pagado' ? 'PAG' : 'COD';

                                            return (
                                                <tr key={inv.id} className="border-b border-gray-300">
                                                    <td className="p-1 text-black">{inv.invoiceNumber.replace('F-','')}</td>
                                                    <td className="p-1 text-black">{paymentType}</td>
                                                    <td className="p-1 text-center text-black">{totalPackages}</td>
                                                    <td className="p-1 text-black">{new Date(inv.date + 'T00:00:00').toLocaleDateString('es-VE', { timeZone: 'UTC' })}</td>
                                                    <td className="p-1 text-black">{receiver?.name}</td>
                                                    <td className="p-1 text-right font-mono text-black">{formatDocCurrency(financials.freight)}</td>
                                                    <td className="p-1 text-right font-mono text-black">{formatDocCurrency(financials.insuranceCost)}</td>
                                                    <td className="p-1 text-right font-mono text-black">{formatDocCurrency(financials.total)}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-gray-200 font-bold">
                                            <td className="p-1 text-black" colSpan={5}>SUB TOTAL ({officeName.toUpperCase()}) →</td>
                                            <td className="p-1 text-right font-mono text-black">{formatDocCurrency(groupTotals.flete)}</td>
                                            <td className="p-1 text-right font-mono text-black">{formatDocCurrency(groupTotals.seguro)}</td>
                                            <td className="p-1 text-right font-mono text-black">{formatDocCurrency(groupTotals.total)}</td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot className="border-t-2 border-black font-bold text-sm bg-gray-200">
                            <tr>
                                <td className="p-1 text-black" colSpan={2}>TOTAL GENERAL →</td>
                                <td className="p-1 text-center text-black">{tableTotals.piezas}</td>
                                <td className="p-1 text-black" colSpan={2}></td>
                                <td className="p-1 text-right font-mono text-black">{formatDocCurrency(tableTotals.flete)}</td>
                                <td className="p-1 text-right font-mono text-black">{formatDocCurrency(tableTotals.seguro)}</td>
                                <td className="p-1 text-right font-mono text-black">{formatDocCurrency(tableTotals.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                
                <section className="mt-4">
                    <h3 className="font-bold text-center text-sm uppercase bg-gray-200 py-1 border-y-2 border-black text-black">RESUMEN DE LIQUIDACIÓN</h3>
                    <div className="mt-2 grid grid-cols-2 gap-6">
                        <div>
                            <table className="w-full text-black">
                                <thead>
                                    <tr className="font-bold border-b border-gray-400">
                                        <td className="py-1 text-black">Concepto</td>
                                        <td className="py-1 text-right text-black">Flete</td>
                                        <td className="py-1 text-right text-black">Seguro</td>
                                        <td className="py-1 text-right text-black">Ipostel</td>
                                        <td className="py-1 text-right text-black">Manejo</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-1 font-bold text-black">PAGADO</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.flete)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.seguro)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.ipostel)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.manejo)}</td>
                                    </tr>
                                    <tr className="border-b border-gray-400">
                                        <td className="py-1 font-bold text-black">DESTINO</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(destinoTotals.flete)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(destinoTotals.seguro)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(destinoTotals.ipostel)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(destinoTotals.manejo)}</td>
                                    </tr>
                                    <tr className="font-bold">
                                        <td className="py-1 text-black">TOTAL</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(totalFleteGeneral)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.seguro + destinoTotals.seguro)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.ipostel + destinoTotals.ipostel)}</td>
                                        <td className="py-1 text-right font-mono text-black">{formatDocCurrency(pagadoTotals.manejo + destinoTotals.manejo)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="border border-gray-300 p-2 rounded-md bg-gray-50">
                            <table className="w-full text-black">
                                <tbody>
                                    <tr><td className="py-0.5 text-black">Flete Pagado (75%)</td><td className="py-0.5 text-right font-mono text-black">{formatDocCurrency(fletePagadoAsociado)}</td></tr>
                                    <tr><td className="py-0.5 text-black">- Seguro (Pagado)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(pagadoTotals.seguro)})</td></tr>
                                    <tr><td className="py-0.5 text-black">- Ipostel (Pagado)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(pagadoTotals.ipostel)})</td></tr>
                                    <tr><td className="py-0.5 text-black">- Manejo (Pagado)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(pagadoTotals.manejo)})</td></tr>
                                    <tr className="font-bold border-t border-gray-400"><td className="py-0.5 text-black">SUB-TOTAL (PAGADO)</td><td className="py-0.5 text-right font-mono text-black">{formatDocCurrency(subTotalPagado)}</td></tr>
                                    
                                    <tr className="font-bold"><td className="py-1.5 text-black" colSpan={2}>Retenciones (Viaje a Destino)</td></tr>
                                    <tr><td className="py-0.5 text-black">- Flete Destino (25%)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(retencionFleteDestino)})</td></tr>
                                    <tr><td className="py-0.5 text-black">- Seguro (Destino)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(destinoTotals.seguro)})</td></tr>
                                    <tr><td className="py-0.5 text-black">- Ipostel (Destino)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(destinoTotals.ipostel)})</td></tr>
                                    <tr><td className="py-0.5 text-black">- Manejo (Destino)</td><td className="py-0.5 text-right font-mono text-black">({formatDocCurrency(destinoTotals.manejo)})</td></tr>
                                    <tr className="font-bold border-t border-gray-400"><td className="py-0.5 text-black">TOTAL A RETENER</td><td className="py-0.5 text-right font-mono text-black">{formatDocCurrency(totalARetener)}</td></tr>
                                    
                                    <tr className="font-bold text-sm bg-gray-300 border-y-2 border-black"><td className="py-1 px-1 text-black">TOTAL A LIQUIDAR (FAVOR ASOCIADO)</td><td className="py-1 px-1 text-right font-mono text-black">{formatDocCurrency(totalALiquidar)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <footer className="mt-16 grid grid-cols-2 gap-16 text-center text-black">
                    <div>
                        <p className="border-t border-black pt-1">Firma Despachador</p>
                    </div>
                    <div>
                        <p className="border-t border-black pt-1">Firma Conductor</p>
                    </div>
                </footer>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
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

export default RemesaDocumentModal;