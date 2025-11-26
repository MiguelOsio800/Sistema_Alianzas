import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReciboPagoAsociado, Asociado, PagoAsociado, CompanyInfo } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PrinterIcon, XIcon } from '../icons/Icons';

interface ReciboPagoAsociadoModalProps {
    isOpen: boolean;
    onClose: () => void;
    recibo: ReciboPagoAsociado;
    asociado: Asociado;
    pagos: PagoAsociado[];
    companyInfo: CompanyInfo;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ReciboPagoAsociadoModal: React.FC<ReciboPagoAsociadoModalProps> = ({ isOpen, onClose, recibo, asociado, pagos, companyInfo }) => {

    const pagosCubiertos = pagos.filter(p => recibo.pagosIds.includes(p.id));

    const handlePrint = () => {
        const input = document.getElementById('recibo-printable-area');
        if (!input) return;
        html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Recibo_${recibo.comprobanteNumero}_${asociado.nombre}.pdf`);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Recibo de Pago: ${recibo.comprobanteNumero}`} size="2xl">
            <div id="recibo-printable-area" className="p-6 bg-white text-black">
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
                    <div className="flex items-center">
                        {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="Logo" className="h-16 w-auto mr-4" />}
                        <div>
                            <h1 className="text-xl font-bold text-black">{companyInfo.name}</h1>
                            <p className="text-xs text-black">RIF: {companyInfo.rif}</p>
                            <p className="text-xs text-black">{companyInfo.address}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-extrabold uppercase text-black">Recibo de Pago</h2>
                        <p className="text-black"><strong>Nº:</strong> <span className="text-red-600 font-bold">{recibo.comprobanteNumero}</span></p>
                        <p className="text-sm text-black"><strong>Fecha:</strong> {recibo.fechaPago}</p>
                    </div>
                </div>

                {/* Asociado Info */}
                <div className="my-6">
                    <h3 className="font-semibold text-lg text-black">Recibido de:</h3>
                    <div className="mt-2 p-3 border rounded-md bg-gray-50 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="text-black"><strong>Asociado:</strong> {asociado.nombre}</div>
                        <div className="text-black"><strong>Código:</strong> {asociado.codigo}</div>
                        <div className="text-black"><strong>C.I./RIF:</strong> {asociado.cedula}</div>
                        <div className="text-black"><strong>Teléfono:</strong> {asociado.telefono}</div>
                    </div>
                </div>

                {/* Conceptos Pagados */}
                <div>
                    <h3 className="font-semibold text-lg mb-2 text-black">Conceptos Pagados:</h3>
                    <table className="min-w-full text-sm border">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-black">Descripción</th>
                                <th className="px-3 py-2 text-right font-semibold text-black">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagosCubiertos.map(p => (
                                <tr key={p.id} className="border-b">
                                    <td className="px-3 py-2 text-black">{p.concepto}</td>
                                    <td className="px-3 py-2 text-right font-mono text-black">{formatCurrency(p.montoBs)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Detalle del Pago */}
                <div className="mt-6">
                    <h3 className="font-semibold text-lg mb-2 text-black">Detalles del Pago:</h3>
                    <div className="p-3 border rounded-md bg-gray-50 space-y-1">
                        {recibo.detallesPago.map((dp, index) => (
                            <div key={index} className="flex justify-between text-sm text-black">
                                <span className="text-black">{dp.tipo} {dp.banco && `- ${dp.banco}`} {dp.referencia && `(Ref: ${dp.referencia})`}</span>
                                <span className="font-mono text-black">{formatCurrency(dp.monto)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total */}
                <div className="mt-6 flex justify-end">
                    <div className="w-full max-w-xs">
                        <div className="flex justify-between items-center bg-gray-800 text-white p-3 rounded-lg">
                            <span className="text-lg font-bold">MONTO TOTAL:</span>
                            <span className="text-xl font-extrabold">{formatCurrency(recibo.montoTotalBs)}</span>
                        </div>
                    </div>
                </div>

            </div>
            <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={onClose}>
                    <XIcon className="w-4 h-4 mr-2" />Cerrar
                </Button>
                <Button type="button" onClick={handlePrint}>
                    <PrinterIcon className="w-4 h-4 mr-2" />Imprimir / Guardar PDF
                </Button>
            </div>
        </Modal>
    );
};

export default ReciboPagoAsociadoModal;