import React, { useState, useMemo } from 'react';
import { Asociado, PagoAsociado, ReciboPagoAsociado, CompanyInfo } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeftIcon, PrinterIcon } from '../icons/Icons';
import Select from '../ui/Select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Input from '../ui/Input';

interface ReportesAsociadosViewProps {
    asociados: Asociado[];
    pagos: PagoAsociado[];
    recibos: ReciboPagoAsociado[];
    companyInfo: CompanyInfo;
}

const formatCurrency = (amount: number) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const EstadoDeCuenta: React.FC<{
    asociado: Asociado,
    pagos: PagoAsociado[],
    recibos: ReciboPagoAsociado[],
    companyInfo: CompanyInfo,
    startDate?: string,
    endDate?: string,
}> = ({ asociado, pagos, recibos, companyInfo, startDate, endDate }) => {

    const transactions = useMemo(() => {
        const debtItems = pagos.map(p => ({
            date: p.fechaVencimiento,
            description: p.concepto,
            debit: p.montoBs,
            credit: 0
        }));
        const paymentItems = recibos.map(r => ({
            date: r.fechaPago,
            description: `Recibo de Pago #${r.comprobanteNumero}`,
            debit: 0,
            credit: r.montoTotalBs
        }));
        
        let allItems = [...debtItems, ...paymentItems];
        
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;
            allItems = allItems.filter(item => {
                const itemDate = new Date(item.date + 'T00:00:00');
                if (start && itemDate < start) return false;
                if (end && itemDate > end) return false;
                return true;
            });
        }

        return allItems.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [pagos, recibos, startDate, endDate]);

    let balance = 0;

    const handlePrint = () => {
        const input = document.getElementById('estado-cuenta-printable');
        if (!input) return;

        html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = canvas.height * pdfWidth / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Estado_Cuenta_${asociado.nombre}.pdf`);
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Estado de Cuenta</CardTitle>
                    <Button onClick={handlePrint}><PrinterIcon className="w-4 h-4 mr-2" /> Imprimir / PDF</Button>
                </div>
            </CardHeader>
            <div id="estado-cuenta-printable" className="p-4 bg-white text-black">
                {/* Header */}
                 <div className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
                    <div className="flex items-center">
                        {companyInfo.logoUrl && (
                            <img src={companyInfo.logoUrl} alt="Logo" className="h-16 w-auto mr-4" />
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-black">{companyInfo.name}</h1>
                            <p className="text-xs text-black">RIF: {companyInfo.rif}</p>
                        </div>
                    </div>
                    <div className="text-right text-black">
                        <h2 className="text-lg font-bold uppercase">Estado de Cuenta</h2>
                        <p className="text-sm">Fecha de Emisión: {new Date().toLocaleDateString('es-VE')}</p>
                    </div>
                </div>
                {/* Asociado Info */}
                <div className="my-6 p-3 border rounded-md bg-gray-50 text-black">
                    <p><strong>Asociado:</strong> {asociado.nombre}</p>
                    <p><strong>Código:</strong> {asociado.codigo}</p>
                    <p><strong>Cédula:</strong> {asociado.cedula}</p>
                </div>
                 {/* Table */}
                <table className="min-w-full text-sm text-black">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-2 py-2 text-left font-semibold text-black">Fecha</th>
                            <th className="px-2 py-2 text-left font-semibold text-black">Concepto / Descripción</th>
                            <th className="px-2 py-2 text-right font-semibold text-black">Debe (Deuda)</th>
                            <th className="px-2 py-2 text-right font-semibold text-black">Haber (Pago)</th>
                            <th className="px-2 py-2 text-right font-semibold text-black">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t, index) => {
                            balance += t.debit - t.credit;
                            return (
                                <tr key={index} className="border-b">
                                    <td className="px-2 py-2 text-black">{t.date}</td>
                                    <td className="px-2 py-2 text-black">{t.description}</td>
                                    <td className="px-2 py-2 text-right font-mono text-black">{t.debit > 0 ? formatCurrency(t.debit) : '-'}</td>
                                    <td className="px-2 py-2 text-right font-mono text-green-600">{t.credit > 0 ? formatCurrency(t.credit) : '-'}</td>
                                    <td className="px-2 py-2 text-right font-mono font-semibold text-black">{formatCurrency(balance)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="font-bold bg-gray-200 border-t-2 border-black">
                        <tr>
                            <td colSpan={4} className="px-2 py-3 text-right text-black">Saldo Final:</td>
                            <td className="px-2 py-3 text-right text-lg text-black">{formatCurrency(balance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </Card>
    )
}


const ReportesAsociadosView: React.FC<ReportesAsociadosViewProps> = (props) => {
    const { asociados, pagos, recibos, companyInfo } = props;
    const [selectedAsociadoId, setSelectedAsociadoId] = useState<string>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const selectedAsociado = useMemo(() => {
        if (!selectedAsociadoId) return null;
        return asociados.find(a => a.id === selectedAsociadoId);
    }, [asociados, selectedAsociadoId]);

    const pagosAsociado = useMemo(() => {
        if (!selectedAsociadoId) return [];
        return pagos.filter(p => p.asociadoId === selectedAsociadoId);
    }, [pagos, selectedAsociadoId]);
    
    const recibosAsociado = useMemo(() => {
        if (!selectedAsociadoId) return [];
        return recibos.filter(r => r.asociadoId === selectedAsociadoId);
    }, [recibos, selectedAsociadoId]);

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'asociados'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver al Módulo de Asociados
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Generar Reporte de Asociado</CardTitle>
                </CardHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <Select
                            label="Seleccione un Asociado"
                            value={selectedAsociadoId}
                            onChange={(e) => setSelectedAsociadoId(e.target.value)}
                        >
                            <option value="">-- Buscar asociado --</option>
                            {asociados.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                            ))}
                        </Select>
                    </div>
                     <div className="md:col-span-1">
                        <Input label="Desde" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <div className="md:col-span-1">
                        <Input label="Hasta" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </Card>
            
            {selectedAsociado && (
                <EstadoDeCuenta 
                    asociado={selectedAsociado}
                    pagos={pagosAsociado}
                    recibos={recibosAsociado}
                    companyInfo={companyInfo}
                    startDate={startDate}
                    endDate={endDate}
                />
            )}

        </div>
    );
};

export default ReportesAsociadosView;