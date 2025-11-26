

import React from 'react';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import { Financials, ShippingGuide } from '../../types';

interface FinancialSummaryProps {
    financials: Financials;
    guide: ShippingGuide;
    bcvRate?: number;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ financials, guide, bcvRate = 0 }) => {
    const formatCurrency = (amount: number) => {
        return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    const formatUsd = (amount: number) => {
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const insuranceLabel = guide.hasInsurance
        ? `Costo del Seguro (${guide.insurancePercentage}%):`
        : 'Costo del Seguro:';
    
    const discountLabel = guide.hasDiscount
        ? `Descuento Aplicado (${guide.discountPercentage}%):`
        : 'Descuento Aplicado:';

    return (
        <Card className="mt-6">
            <CardHeader><CardTitle>Resumen Financiero</CardTitle></CardHeader>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Monto del Flete:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.freight)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{insuranceLabel}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.insuranceCost)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Manejo:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.handling)}</span>
                </div>
                 {financials.discount > 0 && (
                    <div className="flex justify-between text-red-500 dark:text-red-400">
                        <span className="font-medium">{discountLabel}</span>
                        <span className="font-medium">-{formatCurrency(financials.discount)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t dark:border-gray-700 pt-2 mt-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">Subtotal:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(financials.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Ipostel (6%):</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.ipostel)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">IVA (16%):</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.iva)}</span>
                </div>
                 {financials.igtf > 0 && (
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">IGTF (3%):</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(financials.igtf)}</span>
                    </div>
                )}
                <div className="flex justify-between items-center bg-primary-50 dark:bg-primary-900/50 p-3 rounded-lg mt-4">
                    <span className="text-lg font-bold text-primary-700 dark:text-primary-300">MONTO TOTAL:</span>
                    <span className="text-2xl font-extrabold text-primary-700 dark:text-primary-200">{formatCurrency(financials.total)}</span>
                </div>
                 {bcvRate > 0 && (
                    <div className="flex justify-end items-center text-right mt-1 pr-3">
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                           Equivalente: {formatUsd(financials.total / bcvRate)}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FinancialSummary;