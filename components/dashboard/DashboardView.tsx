import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import { DollarSignIcon, ReceiptIcon, ShieldCheckIcon, TruckIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, CheckCircleIcon, SettingsIcon } from '../icons/Icons';
import { Invoice, CompanyInfo, Office, Vehicle, ShippingStatus, MasterStatus } from '../../types';
import { calculateFinancialDetails } from '../../utils/financials';
import Button from '../ui/Button';
import Select from '../ui/Select';

// --- Helper Functions ---
const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PIE_COLORS: { [key in ShippingStatus | 'Anulada']: string } = {
    'En Tránsito': '#3b82f6', // blue
    'Pendiente para Despacho': '#111827', // black/gray-900
    'Anulada': '#ef4444', // red
    'Entregada': '#6b7280', // gray
};


const PAYMENT_TYPE_COLORS = {
    'flete-pagado': '#10b981', // emerald
    'flete-destino': '#8b5cf6', // violet
};

// --- Custom Label Renderer for Pie Chart ---
const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, payload } = props;
    
    // Don't render label if the slice is too small to avoid clutter
    if (percent < 0.05) {
        return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    const percentageText = `${(percent * 100).toFixed(0)}%`;
    const displayName = payload.displayName || name;

    const textStyle: React.CSSProperties = {
        fill: 'white',
        textAnchor: 'middle',
        dominantBaseline: 'central',
        fontSize: '11px',
        fontWeight: 600
    };
    
    const nameParts = displayName.split(' ');
    if (nameParts.length > 1 && displayName.length > 12) {
         return (
            <text x={x} y={y} style={textStyle}>
                {nameParts.map((part, index) => (
                     <tspan key={index} x={x} dy={index === 0 ? '-0.6em' : '1.2em'}>{part}</tspan>
                ))}
                <tspan x={x} dy="1.2em" style={{fontWeight: 'bold'}}>{percentageText}</tspan>
            </text>
        );
    }

    return (
        <text x={x} y={y} style={textStyle}>
            <tspan>{displayName}</tspan>
            <tspan x={x} dy="1.2em" style={{fontWeight: 'bold'}}>{percentageText}</tspan>
        </text>
    );
};


// --- Components ---
interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    change?: string;
    changeType?: 'increase' | 'decrease' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, change, changeType = 'neutral' }) => {
    const changeColor = {
        increase: 'text-green-600 dark:text-green-400',
        decrease: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-500 dark:text-gray-400'
    }[changeType];

    return (
    <Card>
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            {change && (
                <p className={`text-sm mt-1 ${changeColor}`}>
                    {change} vs mes anterior
                </p>
            )}
        </div>
    </Card>
)};

const AlertsPanel: React.FC<{ invoices: Invoice[] }> = ({ invoices }) => {
    const MOCK_CURRENT_DATE = new Date('2025-08-15'); // Use a fixed date for consistent mock data behavior

    const overdueInvoices = useMemo(() => {
        const fifteenDaysAgo = new Date(MOCK_CURRENT_DATE);
        fifteenDaysAgo.setDate(MOCK_CURRENT_DATE.getDate() - 15);

        return invoices.filter(
            (inv) => inv.status === 'Activa' && inv.paymentStatus === 'Pendiente' && new Date(inv.date) < fifteenDaysAgo
        );
    }, [invoices]);

    const alerts = overdueInvoices;

    return (
        <Card className="flex flex-col h-full">
            <CardHeader><CardTitle>Alertas y Notificaciones</CardTitle></CardHeader>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-80">
                {alerts.length === 0 ? (
                    <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Todo en orden</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay alertas importantes.</p>
                    </div>
                ) : (
                    <>
                        {overdueInvoices.map((inv) => (
                            <div key={inv.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-start gap-3">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Factura Vencida</p>
                                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                        La factura <a href={`#edit-invoice/${inv.id}`} className="font-bold underline">#{inv.invoiceNumber}</a> tiene más de 15 días de retraso de pago.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </Card>
    );
};


interface DashboardViewProps {
    invoices: Invoice[];
    vehicles: Vehicle[];
    companyInfo: CompanyInfo;
    offices: Office[];
}

type ChartConfig = {
    view: 'last6' | 'year' | 'month';
    year: number;
    month: number;
    isOpen: boolean;
};

type ChartConfigs = {
    income: ChartConfig;
    status: ChartConfig;
    payment: ChartConfig;
    office: ChartConfig;
};

const DashboardView: React.FC<DashboardViewProps> = ({ invoices, vehicles, companyInfo, offices }) => {
    
    const currentFullYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    const initialChartConfig: ChartConfig = {
        view: 'last6',
        year: currentFullYear,
        month: currentMonth,
        isOpen: false,
    };

    const [chartConfigs, setChartConfigs] = useState<ChartConfigs>({
        income: { ...initialChartConfig },
        status: { ...initialChartConfig },
        payment: { ...initialChartConfig },
        office: { ...initialChartConfig },
    });

    const handleConfigChange = <K extends keyof ChartConfigs, V extends ChartConfig[keyof ChartConfig]>(
        chart: K,
        field: keyof ChartConfig,
        value: V
    ) => {
        setChartConfigs(prev => ({
            ...prev,
            [chart]: {
                ...prev[chart],
                [field]: value,
            },
        }));
    };

    const ConfigPanel: React.FC<{
        chartKey: keyof ChartConfigs;
        config: ChartConfig;
    }> = ({ chartKey, config }) => (
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-end gap-4">
                <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 p-1 rounded-lg w-full md:w-auto">
                    <Button className="flex-1" size="sm" variant={config.view === 'last6' ? 'primary' : 'secondary'} onClick={() => handleConfigChange(chartKey, 'view', 'last6')}>6 Meses</Button>
                    <Button className="flex-1" size="sm" variant={config.view === 'year' ? 'primary' : 'secondary'} onClick={() => handleConfigChange(chartKey, 'view', 'year')}>Anual</Button>
                    <Button className="flex-1" size="sm" variant={config.view === 'month' ? 'primary' : 'secondary'} onClick={() => handleConfigChange(chartKey, 'view', 'month')}>Mensual</Button>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-full md:w-auto">
                    {(config.view === 'year' || config.view === 'month') && (
                        <div className="flex-grow min-w-[120px]">
                            <Select label="Año" value={config.year} onChange={e => handleConfigChange(chartKey, 'year', parseInt(e.target.value))}>
                                {[...Array(5)].map((_, i) => <option key={currentFullYear - i} value={currentFullYear - i}>{currentFullYear - i}</option>)}
                            </Select>
                        </div>
                    )}
                    {config.view === 'month' && (
                         <div className="flex-grow min-w-[150px]">
                            <Select label="Mes" value={config.month} onChange={e => handleConfigChange(chartKey, 'month', parseInt(e.target.value))}>
                                {[...Array(12)].map((_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('es-VE', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}</option>)}
                            </Select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    
    const memoizedStats = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const getMonthStats = (month: number, year: number, invoiceSource: Invoice[]) => {
            const monthInvoices = invoiceSource.filter(inv => {
                if (!inv.date) return false;
                const invDate = new Date(inv.date + 'T00:00:00');
                return invDate.getMonth() === month && invDate.getFullYear() === year && inv.status !== 'Anulada';
            });

            return monthInvoices.reduce((acc, inv) => {
                const financials = calculateFinancialDetails(inv.guide, companyInfo);
                acc.freight += financials.freight;
                acc.iva += financials.iva;
                acc.ipostel += financials.ipostel;
                acc.insuranceCost += financials.insuranceCost;
                return acc;
            }, { freight: 0, iva: 0, ipostel: 0, insuranceCost: 0 });
        };

        const currentMonthStats = getMonthStats(currentMonth, currentYear, invoices);
        const prevMonthDate = new Date(now);
        prevMonthDate.setMonth(currentMonth - 1);
        const prevMonthStats = getMonthStats(prevMonthDate.getMonth(), prevMonthDate.getFullYear(), invoices);

        const calcChange = (current: number, previous: number): { value: string; type: 'increase' | 'decrease' | 'neutral' } => {
            if (previous === 0) return { value: current > 0 ? "+100%" : "0%", type: current > 0 ? 'increase' : 'neutral' };
            if (current === 0 && previous > 0) return { value: "-100%", type: 'decrease' };
            const change = ((current - previous) / previous) * 100;
            return { value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral' };
        };

        // --- CHART HELPER FUNCTIONS ---
        const getChartTitleSuffix = (config: ChartConfig): string => {
            switch (config.view) {
                case 'year': return `(${config.year})`;
                case 'month':
                    const monthName = new Date(config.year, config.month).toLocaleString('es-VE', { month: 'long' });
                    return `(${monthName.replace(/^\w/, c => c.toUpperCase())} ${config.year})`;
                case 'last6': default: return '(Últimos 6 Meses)';
            }
        };

        const getInvoicesForPeriod = (config: ChartConfig): Invoice[] => {
            return invoices.filter(inv => {
                if (!inv.date) return false;
                const invDate = new Date(inv.date + 'T00:00:00');
                switch (config.view) {
                    case 'year': return invDate.getFullYear() === config.year;
                    case 'month': return invDate.getFullYear() === config.year && invDate.getMonth() === config.month;
                    case 'last6': default:
                        const sixMonthsAgo = new Date(now);
                        sixMonthsAgo.setMonth(now.getMonth() - 6);
                        return invDate >= sixMonthsAgo && invDate <= now;
                }
            });
        };
        
        // --- PROCESS DATA FOR EACH CHART ---
        // 1. Income Chart
        const incomeInvoices = getInvoicesForPeriod(chartConfigs.income);
        const incomeChartData: { name: string, Ingresos: number }[] = [];
        const { view, year, month } = chartConfigs.income;
        
        switch (view) {
            case 'year':
                for (let m = 0; m < 12; m++) {
                    const monthName = new Date(year, m).toLocaleString('es-VE', { month: 'short' }).replace(/\./g, '').replace(/^\w/, c => c.toUpperCase());
                    const stats = getMonthStats(m, year, incomeInvoices);
                    incomeChartData.push({ name: monthName, Ingresos: stats.freight });
                }
                break;
            case 'month':
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const dailyInvoices = incomeInvoices.filter(inv => {
                        if (!inv.date) return false;
                        const invDate = new Date(inv.date + 'T00:00:00');
                        return invDate.getDate() === day;
                    });
                    const total = dailyInvoices.reduce((acc, inv) => acc + calculateFinancialDetails(inv.guide, companyInfo).freight, 0);
                    incomeChartData.push({ name: `${day}`, Ingresos: total });
                }
                break;
            case 'last6': default:
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(now);
                    d.setMonth(now.getMonth() - i);
                    const m = d.getMonth();
                    const y = d.getFullYear();
                    const monthName = d.toLocaleString('es-VE', { month: 'short' }).replace(/\./g, '').replace(/^\w/, c => c.toUpperCase());
                    const stats = getMonthStats(m, y, incomeInvoices);
                    incomeChartData.push({ name: monthName, Ingresos: stats.freight });
                }
                break;
        }
        const incomeChartTitle = `Ingresos por Flete ${getChartTitleSuffix(chartConfigs.income)}`;

        // 2. Status Chart
        const statusInvoices = getInvoicesForPeriod(chartConfigs.status);
        const statusCounts = statusInvoices.reduce((acc, inv) => {
            const key = inv.status === 'Anulada' ? 'Anulada' : inv.shippingStatus;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
        const shipmentStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        const statusChartTitle = `Estado de Envíos ${getChartTitleSuffix(chartConfigs.status)}`;

        // 3. Payment Chart
        const paymentInvoices = getInvoicesForPeriod(chartConfigs.payment);
        const paymentTypeCounts = paymentInvoices.reduce((acc, inv) => {
            if (inv.status !== 'Anulada') { acc[inv.guide.paymentType] = (acc[inv.guide.paymentType] || 0) + 1; }
            return acc;
        }, {} as { [key: string]: number });
        const paymentTypeData = Object.entries(paymentTypeCounts).map(([name, value]) => ({ name, value, displayName: name === 'flete-pagado' ? 'Flete Pagado' : 'Flete Destino' }));
        const paymentChartTitle = `Condición de Pago ${getChartTitleSuffix(chartConfigs.payment)}`;

        // 4. Office Chart
        const officeInvoices = getInvoicesForPeriod(chartConfigs.office);
        const officeProductionData = offices.map(office => {
            const officeFilteredInvoices = officeInvoices.filter(inv => inv.guide.originOfficeId === office.id && inv.status !== 'Anulada');
            const total = officeFilteredInvoices.reduce((sum, inv) => sum + calculateFinancialDetails(inv.guide, companyInfo).freight, 0);
            return { name: office.name.split(' - ')[0], Producción: total, }
        });
        const officeChartTitle = `Producción por Oficina ${getChartTitleSuffix(chartConfigs.office)}`;


        return {
            currentMonthStats,
            freightChange: calcChange(currentMonthStats.freight, prevMonthStats.freight),
            ivaChange: calcChange(currentMonthStats.iva, prevMonthStats.iva),
            ipostelChange: calcChange(currentMonthStats.ipostel, prevMonthStats.ipostel),
            insuranceChange: calcChange(currentMonthStats.insuranceCost, prevMonthStats.insuranceCost),
            incomeChartData,
            incomeChartTitle,
            shipmentStatusData,
            statusChartTitle,
            paymentTypeData,
            paymentChartTitle,
            officeProductionData,
            officeChartTitle,
        };

    }, [invoices, companyInfo, offices, chartConfigs]);

    const handlePieClick = (data: any) => {
        if (data && data.name) {
             const filterType = ['Pendiente para Despacho', 'En Tránsito', 'Entregada'].includes(data.name) ? 'shippingStatus' : 'status';
             window.location.hash = `invoices/filter/${filterType}/${encodeURIComponent(data.name)}`;
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Flete (Mes)" value={formatCurrency(memoizedStats.currentMonthStats.freight)} icon={TruckIcon} change={memoizedStats.freightChange.value} changeType={memoizedStats.freightChange.type} />
                <StatCard title="Total IVA (Mes)" value={formatCurrency(memoizedStats.currentMonthStats.iva)} icon={DollarSignIcon} change={memoizedStats.ivaChange.value} changeType={memoizedStats.ivaChange.type} />
                <StatCard title="Total Ipostel (Mes)" value={formatCurrency(memoizedStats.currentMonthStats.ipostel)} icon={ReceiptIcon} change={memoizedStats.ipostelChange.value} changeType={memoizedStats.ipostelChange.type} />
                <StatCard title="Total Seguro (Mes)" value={formatCurrency(memoizedStats.currentMonthStats.insuranceCost)} icon={ShieldCheckIcon} change={memoizedStats.insuranceChange.value} changeType={memoizedStats.insuranceChange.type} />
            </div>

            {/* Main Charts & Alerts */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <CardTitle>{memoizedStats.incomeChartTitle}</CardTitle>
                             <Button variant="secondary" size="sm" onClick={() => handleConfigChange('income', 'isOpen', !chartConfigs.income.isOpen)} className="!p-2">
                                <SettingsIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <div className={`grid transition-all duration-500 ease-in-out ${chartConfigs.income.isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <ConfigPanel chartKey="income" config={chartConfigs.income} />
                        </div>
                    </div>
                    <div className="h-80 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={memoizedStats.incomeChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                <XAxis dataKey="name" className="text-xs" stroke="currentColor" />
                                <YAxis className="text-xs" stroke="currentColor" tickFormatter={(value) => `Bs.${Number(value)/1000}k`} />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        color: '#1f2937',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                    }}
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)'}}
                                />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#3b82f6" barSize={chartConfigs.income.view === 'month' ? 15 : 30}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <AlertsPanel invoices={invoices} />
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>{memoizedStats.statusChartTitle}</CardTitle>
                             <Button variant="secondary" size="sm" onClick={() => handleConfigChange('status', 'isOpen', !chartConfigs.status.isOpen)} className="!p-2">
                                <SettingsIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <div className={`grid transition-all duration-500 ease-in-out ${chartConfigs.status.isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <ConfigPanel chartKey="status" config={chartConfigs.status} />
                        </div>
                    </div>
                    <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={memoizedStats.shipmentStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={95}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={renderCustomizedLabel}
                                    onClick={handlePieClick}
                                    className="cursor-pointer"
                                >
                                    {memoizedStats.shipmentStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        color: '#1f2937'
                                    }}/>
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                 <Card>
                    <CardHeader>
                         <div className="flex justify-between items-center">
                             <CardTitle>{memoizedStats.paymentChartTitle}</CardTitle>
                             <Button variant="secondary" size="sm" onClick={() => handleConfigChange('payment', 'isOpen', !chartConfigs.payment.isOpen)} className="!p-2">
                                <SettingsIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <div className={`grid transition-all duration-500 ease-in-out ${chartConfigs.payment.isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <ConfigPanel chartKey="payment" config={chartConfigs.payment} />
                        </div>
                    </div>
                     <div className="h-80">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={memoizedStats.paymentTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={95}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="displayName"
                                    label={renderCustomizedLabel}
                                >
                                    {memoizedStats.paymentTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PAYMENT_TYPE_COLORS[entry.name as keyof typeof PAYMENT_TYPE_COLORS] || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value, name) => [value, name]}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        color: '#1f2937'
                                    }}
                                />
                                <Legend 
                                    formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
                                    wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
             <div className="grid grid-cols-1">
                 <Card>
                    <CardHeader>
                         <div className="flex justify-between items-center">
                             <CardTitle>{memoizedStats.officeChartTitle}</CardTitle>
                             <Button variant="secondary" size="sm" onClick={() => handleConfigChange('office', 'isOpen', !chartConfigs.office.isOpen)} className="!p-2">
                                <SettingsIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <div className={`grid transition-all duration-500 ease-in-out ${chartConfigs.office.isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <ConfigPanel chartKey="office" config={chartConfigs.office} />
                        </div>
                    </div>
                     <div className="h-80 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={memoizedStats.officeProductionData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700"/>
                                <XAxis dataKey="name" className="text-xs" stroke="currentColor"/>
                                <YAxis className="text-xs" stroke="currentColor" tickFormatter={(value) => `Bs.${Number(value)/1000}k`}/>
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(5px)',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '0.5rem',
                                        color: '#1f2937'
                                    }}
                                    cursor={{fill: 'rgba(0, 0, 0, 0.05)'}}
                                />
                                <Legend />
                                <Bar dataKey="Producción" fill="#16a34a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardView;