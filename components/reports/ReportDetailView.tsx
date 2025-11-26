
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Report, Invoice, Client, Expense, Office, CompanyInfo, PaymentMethod, Vehicle, Category, ShippingStatus, PaymentStatus, Asociado } from '../../types';
import Card, { CardTitle, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { FileSpreadsheetIcon, ArrowLeftIcon, TruckIcon, ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';
import { calculateFinancialDetails, calculateInvoiceChargeableWeight } from '../../utils/financials';
import Select from '../ui/Select';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


interface ReportDetailViewProps {
    report: Report;
    invoices: Invoice[];
    clients: Client[];
    expenses: Expense[];
    offices: Office[];
    companyInfo: CompanyInfo;
    paymentMethods: PaymentMethod[];
    vehicles: Vehicle[];
    categories: Category[];
    asociados: Asociado[];
}

const formatCurrency = (amount: number = 0) => `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ITEMS_PER_PAGE = 20;

const ReportDetailView: React.FC<ReportDetailViewProps> = ({ report, invoices, clients, expenses, offices, companyInfo, paymentMethods, vehicles, asociados }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    const dateFilteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            if (!startDate && !endDate) return true;
            const invoiceDate = new Date(invoice.date + 'T00:00:00');
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;
            if (start && invoiceDate < start) return false;
            if (end && invoiceDate > end) return false;
            return true;
        });
    }, [invoices, startDate, endDate]);
    
    const dateFilteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            if (!startDate && !endDate) return true;
            const expenseDate = new Date(expense.date + 'T00:00:00');
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;
            if (start && expenseDate < start) return false;
            if (end && expenseDate > end) return false;
            return true;
        });
    }, [expenses, startDate, endDate]);

    const reportData = useMemo(() => {
        switch(report.id) {
            case 'general_envios':
                return dateFilteredInvoices.filter(i => i.status === 'Activa');
            case 'libro_venta':
                return dateFilteredInvoices;
            case 'cuentas_cobrar':
                return dateFilteredInvoices.filter(inv => inv.paymentStatus === 'Pendiente' && inv.status === 'Activa');
            case 'cuentas_pagar':
                return dateFilteredExpenses.filter(exp => exp.status === 'Pendiente');
            case 'facturas_anuladas':
                return dateFilteredInvoices.filter(invoice => invoice.status === 'Anulada');
            case 'ipostel':
                return dateFilteredInvoices.filter(inv => inv.status !== 'Anulada' && calculateFinancialDetails(inv.guide, companyInfo).ipostel > 0);
            case 'seguro':
                 return dateFilteredInvoices.filter(inv => inv.status !== 'Anulada' && inv.guide.hasInsurance);
            case 'clientes':
                 const clientMov = dateFilteredInvoices.filter(inv => inv.status !== 'Anulada').reduce((acc, inv) => {
                    const clientId = inv.clientIdNumber;
                    if (!acc[clientId]) {
                        const clientInfo = clients.find(c => c.idNumber === clientId);
                        acc[clientId] = { id: clientId, name: inv.clientName, phone: clientInfo?.phone || 'N/A', count: 0, total: 0 };
                    }
                    acc[clientId].count++;
                    acc[clientId].total += inv.totalAmount;
                    return acc;
                }, {} as Record<string, { id: string, name: string, phone: string, count: number, total: number }>);
                // FIX: Add explicit types to sort parameters to resolve 'unknown' type error.
                return Object.values(clientMov).sort((a: { total: number; }, b: { total: number; }) => b.total - a.total);
            case 'iva':
                return dateFilteredInvoices.filter(inv => inv.status !== 'Anulada');
            case 'cuadre_caja':
                const cashFlowMap = paymentMethods.reduce((acc, pm) => {
                    acc[pm.id] = { id: pm.id, name: pm.name, income: 0, expense: 0, incomes: [], expenses: [] };
                    return acc;
                }, {} as Record<string, { id: string; name: string; income: number; expense: number; incomes: Invoice[]; expenses: Expense[] }>);

                dateFilteredInvoices.filter(i => i.paymentStatus === 'Pagada' && i.status !== 'Anulada').forEach(inv => {
                    if (cashFlowMap[inv.guide.paymentMethodId]) {
                        cashFlowMap[inv.guide.paymentMethodId].income += inv.totalAmount;
                        cashFlowMap[inv.guide.paymentMethodId].incomes.push(inv);
                    }
                });
                dateFilteredExpenses.filter(e => e.status === 'Pagado' && e.paymentMethodId).forEach(exp => {
                    if (exp.paymentMethodId && cashFlowMap[exp.paymentMethodId]) {
                        cashFlowMap[exp.paymentMethodId].expense += exp.amount;
                        cashFlowMap[exp.paymentMethodId].expenses.push(exp);
                    }
                });
                // FIX: Add explicit type to filter parameter to resolve 'unknown' type error.
                return Object.values(cashFlowMap).filter((item: { income: number; expense: number; }) => item.income > 0 || item.expense > 0);
            case 'envios_oficina':
                const officeProductivity = dateFilteredInvoices.filter(inv => inv.status !== 'Anulada').reduce((acc, inv) => {
                    const officeId = inv.guide.originOfficeId;
                    if (!acc[officeId]) acc[officeId] = { id: officeId, name: offices.find(o => o.id === officeId)?.name || 'Desconocida', totalFacturado: 0, envios: 0, totalKg: 0 };
                    acc[officeId].totalFacturado += inv.totalAmount;
                    acc[officeId].envios++;
                    acc[officeId].totalKg += calculateInvoiceChargeableWeight(inv);
                    return acc;
                }, {} as Record<string, { id: string, name: string, totalFacturado: number, envios: number, totalKg: number }>);
                return Object.values(officeProductivity);
            case 'gastos_oficina':
                const officeExpenses: Record<string, { id: string; name: string; total: number; count: number; expenses: Expense[] }> = {};
                dateFilteredExpenses.forEach(exp => {
                    const officeId = exp.officeId || 'general';
                    if (!officeExpenses[officeId]) {
                        officeExpenses[officeId] = {
                            id: officeId,
                            name: offices.find(o => o.id === officeId)?.name || 'Gastos Generales',
                            total: 0,
                            count: 0,
                            expenses: []
                        };
                    }
                    officeExpenses[officeId].total += exp.amount;
                    officeExpenses[officeId].count++;
                    officeExpenses[officeId].expenses.push(exp);
                });
                return Object.values(officeExpenses);
            case 'reporte_kilogramos':
                return dateFilteredInvoices.filter(inv => inv.status !== 'Anulada');
            case 'reporte_envios_vehiculo':
                const vehicleInvoices = dateFilteredInvoices.filter(inv => inv.status !== 'Anulada' && inv.vehicleId);
                const groupedByVehicleId = vehicleInvoices.reduce((acc, inv) => {
                    const key = inv.vehicleId!;
                    if (!acc[key]) {
                        const vehicle = vehicles.find(v => v.id === key);
                        const asociado = vehicle ? asociados.find(a => a.id === vehicle.asociadoId) : undefined;
                        acc[key] = { vehicle, asociado, invoices: [] };
                    }
                    acc[key].invoices.push(inv);
                    return acc;
                }, {} as Record<string, { vehicle: Vehicle | undefined, asociado: Asociado | undefined, invoices: Invoice[] }>);
                return Object.values(groupedByVehicleId);
            default:
                return [];
        }
    }, [report.id, dateFilteredInvoices, dateFilteredExpenses, companyInfo, clients, paymentMethods, offices, vehicles, asociados]);

    const { paginatedData, currentPage, totalPages, setCurrentPage, totalItems } = usePagination<any>(
        Array.isArray(reportData) ? reportData : [],
        ITEMS_PER_PAGE
    );

    const handleExport = () => {
        let dataToExport: any[] = [];
        let sheetName = report.title.replace(/\s/g, '_').substring(0, 30);
        let totalsRow: any = {};
        let headers: string[] = [];

        const sourceData = Array.isArray(reportData) ? reportData : [];

        switch(report.id) {
            case 'general_envios':
                headers = ["Fecha", "N° Factura", "N° Control", "Remitente", "Destinatario", "Oficina Origen", "Oficina Destino", "Monto Total", "Estado Pago", "Estado Envío"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => ({
                    [headers[0]]: inv.date,
                    [headers[1]]: inv.invoiceNumber,
                    [headers[2]]: inv.controlNumber,
                    [headers[3]]: inv.guide.sender.name,
                    [headers[4]]: inv.guide.receiver.name,
                    [headers[5]]: offices.find(o => o.id === inv.guide.originOfficeId)?.name || 'N/A',
                    [headers[6]]: offices.find(o => o.id === inv.guide.destinationOfficeId)?.name || 'N/A',
                    [headers[7]]: inv.totalAmount,
                    [headers[8]]: inv.paymentStatus,
                    [headers[9]]: inv.shippingStatus,
                }));
                break;
            case 'libro_venta':
                headers = ["Fecha", "N° Factura", "N° Control", "Nombre/Razón Social Cliente", "RIF/CI Cliente", "Venta Total", "Base Imponible", "IVA (16%)", "IPOSTEL"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => {
                    const fin = calculateFinancialDetails(inv.guide, companyInfo);
                    return inv.status === 'Anulada' ? {
                        [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.controlNumber, [headers[3]]: inv.clientName, [headers[4]]: inv.clientIdNumber, [headers[5]]: "ANULADA", [headers[6]]: 0, [headers[7]]: 0, [headers[8]]: 0
                    } : {
                        [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.controlNumber, [headers[3]]: inv.clientName, [headers[4]]: inv.clientIdNumber, [headers[5]]: fin.total, [headers[6]]: fin.subtotal, [headers[7]]: fin.iva, [headers[8]]: fin.ipostel
                    };
                });
                const salesTotals = (sourceData as unknown as Invoice[]).reduce((acc, inv) => {
                    if (inv.status !== 'Anulada') {
                        const fin = calculateFinancialDetails(inv.guide, companyInfo);
                        acc.total += fin.total; acc.base += fin.subtotal; acc.iva += fin.iva; acc.ipostel += fin.ipostel;
                    } return acc;
                }, { total: 0, base: 0, iva: 0, ipostel: 0 });
                totalsRow = { [headers[3]]: "TOTALES", [headers[5]]: salesTotals.total, [headers[6]]: salesTotals.base, [headers[7]]: salesTotals.iva, [headers[8]]: salesTotals.ipostel };
                break;
            case 'cuentas_cobrar':
                headers = ["Fecha de Emisión", "N° Factura", "Cliente", "Teléfono del Cliente", "Días Vencidos", "Monto Pendiente"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => {
                    const days = Math.floor((new Date().getTime() - new Date(inv.date).getTime()) / (1000 * 3600 * 24));
                    const client = clients.find(c => c.idNumber === inv.clientIdNumber);
                    return { [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.clientName, [headers[3]]: client?.phone, [headers[4]]: days, [headers[5]]: inv.totalAmount };
                });
                totalsRow = { [headers[2]]: "TOTAL", [headers[5]]: (sourceData as unknown as Invoice[]).reduce((sum, inv) => sum + inv.totalAmount, 0) };
                break;
            case 'cuentas_pagar':
                headers = ["Fecha", "Proveedor", "RIF Proveedor", "N° Factura", "Descripción del Gasto", "Días Vencidos", "Monto Pendiente"];
                dataToExport = (sourceData as unknown as Expense[]).map(exp => {
                    const days = Math.floor((new Date().getTime() - new Date(exp.date).getTime()) / (1000 * 3600 * 24));
                    return { [headers[0]]: exp.date, [headers[1]]: exp.supplierName, [headers[2]]: exp.supplierRif, [headers[3]]: exp.invoiceNumber, [headers[4]]: exp.description, [headers[5]]: days, [headers[6]]: exp.amount };
                });
                totalsRow = { [headers[1]]: "TOTAL", [headers[6]]: (sourceData as unknown as Expense[]).reduce((sum, exp) => sum + exp.amount, 0) };
                break;
            case 'facturas_anuladas':
                headers = ["Fecha de Anulación", "N° Factura", "N° Control", "Cliente", "Monto Original"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => ({
                    [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.controlNumber, [headers[3]]: inv.clientName, [headers[4]]: inv.totalAmount
                }));
                break;
            case 'iva':
                headers = ["Fecha", "N° Factura", "Cliente", "Monto Total", "IVA (16%)"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => {
                    const fin = calculateFinancialDetails(inv.guide, companyInfo);
                    return {
                        [headers[0]]: inv.date,
                        [headers[1]]: inv.invoiceNumber,
                        [headers[2]]: inv.clientName,
                        [headers[3]]: inv.totalAmount,
                        [headers[4]]: fin.iva,
                    };
                });
                const ivaTotals = (sourceData as unknown as Invoice[]).reduce((acc, inv) => {
                    if (inv.status !== 'Anulada') {
                        const fin = calculateFinancialDetails(inv.guide, companyInfo);
                        acc.total += inv.totalAmount;
                        acc.iva += fin.iva;
                    }
                    return acc;
                }, { total: 0, iva: 0 });
                totalsRow = {
                    [headers[2]]: "TOTALES",
                    [headers[3]]: ivaTotals.total,
                    [headers[4]]: ivaTotals.iva,
                };
                break;
            case 'cuadre_caja':
                 headers = ["Método de Pago", "Ingresos", "Egresos", "Saldo"];
                 dataToExport = (sourceData as any[]).map(d => ({ [headers[0]]: d.name, [headers[1]]: d.income, [headers[2]]: d.expense, [headers[3]]: d.income - d.expense }));
                break;
            case 'envios_oficina':
                headers = ["Oficina", "Total Facturado", "N° Envíos", "Total Kilos Movilizados"];
                dataToExport = (sourceData as any[]).map(d => ({ [headers[0]]: d.name, [headers[1]]: d.totalFacturado, [headers[2]]: d.envios, [headers[3]]: d.totalKg }));
                break;
            case 'gastos_oficina':
                headers = ["Oficina", "Monto Total Gastado", "N° Gastos"];
                dataToExport = (sourceData as any[]).map(d => ({ [headers[0]]: d.name, [headers[1]]: d.total, [headers[2]]: d.count }));
                break;
             case 'reporte_kilogramos':
                headers = ["Fecha", "N° Factura", "Cliente", "Total Kilogramos"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => ({
                    [headers[0]]: inv.date,
                    [headers[1]]: inv.invoiceNumber,
                    [headers[2]]: inv.clientName,
                    [headers[3]]: calculateInvoiceChargeableWeight(inv)
                }));
                totalsRow = { [headers[2]]: "TOTAL", [headers[3]]: (sourceData as unknown as Invoice[]).reduce((sum, inv) => sum + calculateInvoiceChargeableWeight(inv), 0) };
                break;
             case 'reporte_envios_vehiculo':
                 headers = ["Asociado", "Vehículo", "Placa", "Factura #", "Cliente", "Monto", "Kg"];
                 dataToExport = (sourceData as any[]).flatMap(d => d.invoices.map((inv: Invoice) => ({
                    [headers[0]]: d.asociado?.nombre, [headers[1]]: d.vehicle.model, [headers[2]]: d.vehicle.plate, [headers[3]]: inv.invoiceNumber, [headers[4]]: inv.clientName, [headers[5]]: inv.totalAmount, [headers[6]]: calculateInvoiceChargeableWeight(inv)
                 })));
                 break;
            case 'clientes':
                headers = ["RIF/CI", "Nombre Cliente", "Teléfono", "N° Envíos", "Monto Total Facturado"];
                dataToExport = (sourceData as any[]).map(c => ({
                    [headers[0]]: c.id, [headers[1]]: c.name, [headers[2]]: c.phone, [headers[3]]: c.count, [headers[4]]: c.total
                }));
                break;
            case 'ipostel':
                headers = ["Fecha", "Factura", "Cliente", "Monto Total", "Base Aporte", "Aporte IPOSTEL"];
                dataToExport = (sourceData as unknown as Invoice[]).map(inv => {
                    const ipostelAmount = calculateFinancialDetails(inv.guide, companyInfo).ipostel;
                    const ipostelBase = ipostelAmount > 0 ? ipostelAmount / 0.06 : 0;
                    return {
                        [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.clientName, [headers[3]]: inv.totalAmount, [headers[4]]: ipostelBase, [headers[5]]: ipostelAmount
                    }
                });
                break;
            case 'seguro':
                 headers = ["Fecha", "Factura", "Cliente", "Valor Declarado", "Costo Seguro"];
                 dataToExport = (sourceData as unknown as Invoice[]).map(inv => ({
                    [headers[0]]: inv.date, [headers[1]]: inv.invoiceNumber, [headers[2]]: inv.clientName, [headers[3]]: inv.guide.declaredValue, [headers[4]]: calculateFinancialDetails(inv.guide, companyInfo).insuranceCost
                }));
                break;
            default:
                alert('La exportación para este reporte no está implementada.');
                return;
        }

        if (Object.keys(totalsRow).length > 0) {
            dataToExport.push({}); // Spacer row
            dataToExport.push(totalsRow);
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${sheetName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    const renderReportContent = () => {
        const tableReports = ['general_envios', 'libro_venta', 'cuentas_cobrar', 'cuentas_pagar', 'facturas_anuladas', 'ipostel', 'seguro', 'clientes', 'reporte_kilogramos', 'iva'];
        const cardReports = ['cuadre_caja', 'envios_oficina', 'gastos_oficina', 'reporte_envios_vehiculo'];

        // --- Render Card-Based Reports ---
        if (cardReports.includes(report.id)) {
            const data = reportData as any[];
            if (!data || data.length === 0) return <p className="text-center py-10 text-gray-500">No hay datos para mostrar en el período seleccionado.</p>;

            switch(report.id) {
                case 'cuadre_caja':
                    return (
                        <div className="space-y-4">
                            {data.map(d => (
                                <Card key={d.name} className="p-0 overflow-hidden">
                                    <button onClick={() => setExpandedCard(expandedCard === d.id ? null : d.id)} className="w-full text-left bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg text-black">{d.name}</h4>
                                            <div className="grid grid-cols-3 gap-4 mt-2 text-center">
                                                <div><p className="text-xl font-semibold text-green-600">{formatCurrency(d.income)}</p><p className="text-xs text-gray-500">Ingresos</p></div>
                                                <div><p className="text-xl font-semibold text-red-600">{formatCurrency(d.expense)}</p><p className="text-xs text-gray-500">Egresos</p></div>
                                                <div><p className="text-2xl font-bold text-black">{formatCurrency(d.income - d.expense)}</p><p className="text-xs text-gray-500">Saldo Final</p></div>
                                            </div>
                                        </div>
                                        <div className={`transform transition-transform duration-300 ${expandedCard === d.id ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                    </button>
                                    <div className={`grid transition-all duration-500 ease-in-out ${expandedCard === d.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-4 border-t dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h5 className="font-semibold mb-2 text-black">Ingresos ({d.incomes.length})</h5>
                                                    <ul className="text-sm space-y-1 max-h-40 overflow-y-auto pr-2 text-black">
                                                        {d.incomes.map((inv: Invoice) => <li key={inv.id} className="flex justify-between"><span>Fact. {inv.invoiceNumber}</span> <span>{formatCurrency(inv.totalAmount)}</span></li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold mb-2 text-black">Egresos ({d.expenses.length})</h5>
                                                    <ul className="text-sm space-y-1 max-h-40 overflow-y-auto pr-2 text-black">
                                                        {d.expenses.map((exp: Expense) => <li key={exp.id} className="flex justify-between"><span>{exp.description}</span> <span>{formatCurrency(exp.amount)}</span></li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    );
                case 'envios_oficina':
                     return (
                         <table className="min-w-full text-sm text-black">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                 <tr>
                                     <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-black">Oficina</th>
                                     <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-black">N° Envíos</th>
                                     <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-black">Total Kg</th>
                                     <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-black">Total Facturado</th>
                                     <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-black">Promedio / Envío</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-black">
                                 {data.map(d => (
                                     <tr key={d.id}>
                                         <td className="px-4 py-3 font-semibold">{d.name}</td>
                                         <td className="px-4 py-3 text-center">{d.envios}</td>
                                         <td className="px-4 py-3 text-right">{d.totalKg.toFixed(2)}</td>
                                         <td className="px-4 py-3 text-right font-bold">{formatCurrency(d.totalFacturado)}</td>
                                         <td className="px-4 py-3 text-right">{formatCurrency(d.envios > 0 ? d.totalFacturado / d.envios : 0)}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                    );
                case 'gastos_oficina':
                    return (
                        <div className="space-y-4">
                            {data.map(d => (
                                <Card key={d.id} className="p-0 overflow-hidden">
                                    <button onClick={() => setExpandedCard(expandedCard === d.id ? null : d.id)} className="w-full text-left bg-gray-50 dark:bg-gray-800/50 p-4 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                        <div>
                                            <h4 className="font-bold text-lg text-black">{d.name}</h4>
                                            <p className="text-sm text-gray-500">{d.count} gasto(s) registrado(s)</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-bold text-red-600">{formatCurrency(d.total)}</span>
                                            <div className={`transform transition-transform duration-300 ${expandedCard === d.id ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon className="w-6 h-6 text-gray-500" />
                                            </div>
                                        </div>
                                    </button>
                                    <div className={`grid transition-all duration-500 ease-in-out ${expandedCard === d.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-4 border-t dark:border-gray-700 max-h-60 overflow-y-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead>
                                                        <tr className="text-black">
                                                            <th className="text-left py-1 text-black">Fecha</th>
                                                            <th className="text-left py-1 text-black">Descripción</th>
                                                            <th className="text-left py-1 text-black">Categoría</th>
                                                            <th className="text-right py-1 text-black">Monto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-black">
                                                        {d.expenses.map((exp: Expense) => (
                                                            <tr key={exp.id} className="border-t dark:border-gray-700">
                                                                <td className="py-1.5">{exp.date}</td>
                                                                <td className="py-1.5">{exp.description}</td>
                                                                <td className="py-1.5">{exp.category}</td>
                                                                <td className="text-right py-1.5">{formatCurrency(exp.amount)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    );
                case 'reporte_envios_vehiculo':
                     return (
                        <div className="space-y-6">
                            {data.map((d, index) => {
                                const totalAmount = d.invoices.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0);
                                const totalKg = d.invoices.reduce((sum: number, inv: Invoice) => sum + calculateInvoiceChargeableWeight(inv), 0);
                                return (
                                <Card key={index} className="p-0 overflow-hidden">
                                    <button onClick={() => setExpandedCard(d.vehicle.id)} className="w-full text-left bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                                        <TruckIcon className="w-8 h-8 text-primary-500 shrink-0"/>
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg text-black">{d.vehicle ? `${d.vehicle.modelo} - ${d.vehicle.placa}` : 'Vehículo no encontrado'}</h4>
                                            <p className="text-sm text-gray-500">Asociado: {d.asociado?.nombre || 'N/A'} | Total: {d.invoices.length} facturas | {formatCurrency(totalAmount)} | {totalKg.toFixed(2)} Kg</p>
                                        </div>
                                        <div className={`transform transition-transform duration-300 ${expandedCard === d.vehicle.id ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon className="w-6 h-6 text-gray-500" />
                                        </div>
                                    </button>
                                    <div className={`grid transition-all duration-500 ease-in-out ${expandedCard === d.vehicle.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                        <div className="overflow-hidden">
                                            <div className="p-4 max-h-60 overflow-y-auto border-t dark:border-gray-700">
                                                <table className="min-w-full text-sm">
                                                    <thead><tr className="text-black"><th className="text-left py-1 text-black">Factura #</th><th className="text-left py-1 text-black">Cliente</th><th className="text-right py-1 text-black">Monto</th><th className="text-right py-1 text-black">Kg</th></tr></thead>
                                                    <tbody className="text-black">
                                                    {d.invoices.map((inv: Invoice) => <tr key={inv.id} className="border-t dark:border-gray-700"><td className="py-1.5">{inv.invoiceNumber}</td><td className="py-1.5">{inv.clientName}</td><td className="text-right py-1.5">{formatCurrency(inv.totalAmount)}</td><td className="text-right py-1.5">{calculateInvoiceChargeableWeight(inv).toFixed(2)}</td></tr>)}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )})}
                        </div>
                    );
            }
        }
        
        // --- Render Paginated Table Reports ---
        if (tableReports.includes(report.id)) {
            let headers: string[] = [];
            let body;
            let footer;
            
            switch (report.id) {
                case 'general_envios':
                    headers = ["Fecha", "N° Factura", "Cliente", "Destino", "Total", "Estado Pago", "Estado Envío"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2">{offices.find(o => o.id === inv.guide.destinationOfficeId)?.name}</td><td className="px-2 py-2 text-right">{formatCurrency(inv.totalAmount)}</td><td className="px-2 py-2">{inv.paymentStatus}</td><td className="px-2 py-2">{inv.shippingStatus}</td></tr>));
                    const generalTotals = (reportData as Invoice[]).reduce((acc, inv) => { acc.total += inv.totalAmount; return acc; }, { total: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={4} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-right">{formatCurrency(generalTotals.total)}</td> <td colSpan={2}></td> </tr> </tfoot> );
                    break;
                case 'libro_venta':
                     headers = ["Fecha", "Factura", "Control", "Cliente", "RIF", "Total", "Base", "IVA", "IPOSTEL"];
                     body = (paginatedData as unknown as Invoice[]).map(inv => {
                        const fin = calculateFinancialDetails(inv.guide, companyInfo);
                        return (<tr key={inv.id} className={inv.status === 'Anulada' ? 'text-red-500 line-through' : ''}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.controlNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2">{inv.clientIdNumber}</td><td className="px-2 py-2 text-right">{inv.status === 'Anulada' ? 'ANULADA' : formatCurrency(fin.total)}</td><td className="px-2 py-2 text-right">{inv.status === 'Anulada' ? '0.00' : formatCurrency(fin.subtotal)}</td><td className="px-2 py-2 text-right">{inv.status === 'Anulada' ? '0.00' : formatCurrency(fin.iva)}</td><td className="px-2 py-2 text-right">{inv.status === 'Anulada' ? '0.00' : formatCurrency(fin.ipostel)}</td></tr>);
                     });
                     const libroVentaTotals = (reportData as Invoice[]).reduce((acc, inv) => { if (inv.status !== 'Anulada') { const fin = calculateFinancialDetails(inv.guide, companyInfo); acc.total += fin.total; acc.base += fin.subtotal; acc.iva += fin.iva; acc.ipostel += fin.ipostel; } return acc; }, { total: 0, base: 0, iva: 0, ipostel: 0 });
                     footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={5} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-right">{formatCurrency(libroVentaTotals.total)}</td> <td className="px-2 py-3 text-right">{formatCurrency(libroVentaTotals.base)}</td> <td className="px-2 py-3 text-right">{formatCurrency(libroVentaTotals.iva)}</td> <td className="px-2 py-3 text-right">{formatCurrency(libroVentaTotals.ipostel)}</td> </tr> </tfoot> );
                     break;
                case 'cuentas_cobrar':
                    headers = ["Fecha Emisión", "Factura", "Cliente", "Teléfono", "Días Vencidos", "Monto Pendiente"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => {
                         const days = Math.floor((new Date().getTime() - new Date(inv.date).getTime()) / (1000 * 3600 * 24));
                         const client = clients.find(c => c.idNumber === inv.clientIdNumber);
                        return (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2">{client?.phone}</td><td className="px-2 py-2 text-center">{days}</td><td className="px-2 py-2 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td></tr>)
                    });
                    const cxcTotals = (reportData as Invoice[]).reduce((acc, inv) => { acc.total += inv.totalAmount; return acc; }, { total: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={5} className="px-2 py-3 text-left">TOTAL PENDIENTE</td> <td className="px-2 py-3 text-right">{formatCurrency(cxcTotals.total)}</td> </tr> </tfoot> );
                    break;
                case 'cuentas_pagar':
                    headers = ["Fecha", "Proveedor", "RIF", "Factura Prov.", "Días Vencidos", "Monto Pendiente"];
                    body = (paginatedData as unknown as Expense[]).map(exp => {
                         const days = Math.floor((new Date().getTime() - new Date(exp.date).getTime()) / (1000 * 3600 * 24));
                        return (<tr key={exp.id}><td className="px-2 py-2">{exp.date}</td><td className="px-2 py-2">{exp.supplierName}</td><td className="px-2 py-2">{exp.supplierRif}</td><td className="px-2 py-2">{exp.invoiceNumber}</td><td className="px-2 py-2 text-center">{days}</td><td className="px-2 py-2 text-right font-semibold">{formatCurrency(exp.amount)}</td></tr>)
                    });
                    const cxpTotals = (reportData as Expense[]).reduce((acc, exp) => { acc.total += exp.amount; return acc; }, { total: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={5} className="px-2 py-3 text-left">TOTAL PENDIENTE</td> <td className="px-2 py-3 text-right">{formatCurrency(cxpTotals.total)}</td> </tr> </tfoot> );
                    break;
                case 'facturas_anuladas':
                    headers = ["Fecha", "Factura", "Control", "Cliente", "Monto Original"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.controlNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2 text-right">{formatCurrency(inv.totalAmount)}</td></tr>));
                    const anuladasTotals = (reportData as Invoice[]).reduce((acc, inv) => { acc.total += inv.totalAmount; return acc; }, { total: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={4} className="px-2 py-3 text-left">TOTAL ANULADO</td> <td className="px-2 py-3 text-right">{formatCurrency(anuladasTotals.total)}</td> </tr> </tfoot> );
                    break;
                case 'ipostel':
                    headers = ["Fecha", "Factura", "Cliente", "Base Aporte", "Aporte IPOSTEL"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => {
                        const ipostelAmount = calculateFinancialDetails(inv.guide, companyInfo).ipostel;
                        const ipostelBase = ipostelAmount > 0 ? ipostelAmount / 0.06 : 0;
                        return (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2 text-right">{formatCurrency(ipostelBase)}</td><td className="px-2 py-2 text-right font-semibold">{formatCurrency(ipostelAmount)}</td></tr>)
                    });
                    const ipostelTotals = (reportData as Invoice[]).reduce((acc, inv) => { const ipostelAmount = calculateFinancialDetails(inv.guide, companyInfo).ipostel; const ipostelBase = ipostelAmount > 0 ? ipostelAmount / 0.06 : 0; acc.base += ipostelBase; acc.ipostel += ipostelAmount; return acc; }, { base: 0, ipostel: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={3} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-right">{formatCurrency(ipostelTotals.base)}</td> <td className="px-2 py-3 text-right">{formatCurrency(ipostelTotals.ipostel)}</td> </tr> </tfoot> );
                    break;
                case 'seguro':
                    headers = ["Fecha", "Factura", "Cliente", "Valor Declarado", "Costo Seguro"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2 text-right">{formatCurrency(inv.guide.declaredValue)}</td><td className="px-2 py-2 text-right font-semibold">{formatCurrency(calculateFinancialDetails(inv.guide, companyInfo).insuranceCost)}</td></tr>));
                    const seguroTotals = (reportData as Invoice[]).reduce((acc, inv) => { acc.declared += inv.guide.declaredValue; acc.cost += calculateFinancialDetails(inv.guide, companyInfo).insuranceCost; return acc; }, { declared: 0, cost: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={3} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-right">{formatCurrency(seguroTotals.declared)}</td> <td className="px-2 py-3 text-right">{formatCurrency(seguroTotals.cost)}</td> </tr> </tfoot> );
                    break;
                case 'clientes':
                    headers = ["RIF/CI", "Cliente", "Teléfono", "N° Envíos", "Monto Facturado"];
                    body = (paginatedData as any[]).map(data => (<tr key={data.id}><td className="px-2 py-2">{data.id}</td><td className="px-2 py-2">{data.name}</td><td className="px-2 py-2">{data.phone}</td><td className="px-2 py-2 text-center">{data.count}</td><td className="px-2 py-2 text-right font-semibold">{formatCurrency(data.total)}</td></tr>));
                    const clientesTotals = (reportData as any[]).reduce((acc, data) => { acc.envios += data.count; acc.monto += data.total; return acc; }, { envios: 0, monto: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={3} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-center">{clientesTotals.envios}</td> <td className="px-2 py-3 text-right">{formatCurrency(clientesTotals.monto)}</td> </tr> </tfoot> );
                    break;
                case 'reporte_kilogramos':
                    headers = ["Fecha", "Nº Factura", "Cliente", "Total Kilogramos"];
                     body = (paginatedData as unknown as Invoice[]).map(inv => (<tr key={inv.id}><td className="px-2 py-2">{inv.date}</td><td className="px-2 py-2">{inv.invoiceNumber}</td><td className="px-2 py-2">{inv.clientName}</td><td className="px-2 py-2 text-right font-semibold">{calculateInvoiceChargeableWeight(inv).toFixed(2)} Kg</td></tr>));
                    const kgTotals = (reportData as Invoice[]).reduce((acc, inv) => { acc.kg += calculateInvoiceChargeableWeight(inv); return acc; }, { kg: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={3} className="px-2 py-3 text-left">TOTAL KG MOVILIZADOS</td> <td className="px-2 py-3 text-right">{kgTotals.kg.toFixed(2)} Kg</td> </tr> </tfoot> );
                    break;
                case 'iva':
                    headers = ["Fecha", "N° Factura", "Cliente", "Monto Total", "IVA (16%)"];
                    body = (paginatedData as unknown as Invoice[]).map(inv => {
                        const fin = calculateFinancialDetails(inv.guide, companyInfo);
                        return ( <tr key={inv.id}> <td className="px-2 py-2">{inv.date}</td> <td className="px-2 py-2">{inv.invoiceNumber}</td> <td className="px-2 py-2">{inv.clientName}</td> <td className="px-2 py-2 text-right">{formatCurrency(inv.totalAmount)}</td> <td className="px-2 py-2 text-right font-semibold">{formatCurrency(fin.iva)}</td> </tr> );
                    });
                    const ivaTotals = (reportData as Invoice[]).reduce((acc, inv) => { const fin = calculateFinancialDetails(inv.guide, companyInfo); acc.total += inv.totalAmount; acc.iva += fin.iva; return acc; }, { total: 0, iva: 0 });
                    footer = ( <tfoot className="bg-gray-100 dark:bg-gray-800/80 font-bold text-black"> <tr> <td colSpan={3} className="px-2 py-3 text-left">TOTALES</td> <td className="px-2 py-3 text-right">{formatCurrency(ivaTotals.total)}</td> <td className="px-2 py-3 text-right">{formatCurrency(ivaTotals.iva)}</td> </tr> </tfoot> );
                    break;
            }

            return (
                <>
                    <table className="min-w-full text-sm text-black">
                        <thead className="bg-gray-50 dark:bg-gray-700/50"><tr>{headers.map(h => <th key={h} className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-black">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-black">{body}</tbody>
                        {footer}
                    </table>
                    <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} />
                </>
            );
        }

        return <div className="p-6 text-center text-gray-500">Este reporte no está implementado.</div>;
    };
    
    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="secondary" onClick={() => window.location.hash = 'reports'}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Volver a Reportes
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                             <CardTitle>{report.title}</CardTitle>
                             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Filtre por fecha y exporte los datos.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                           <Input label="" type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                           <Input label="" type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                           <Button onClick={handleExport} className="w-full sm:w-auto">
                                <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
                                Exportar
                           </Button>
                        </div>
                    </div>
                </CardHeader>
                <div className="overflow-x-auto mt-4 text-black">
                    {renderReportContent()}
                </div>
            </Card>
        </div>
    );
};

export default ReportDetailView;
