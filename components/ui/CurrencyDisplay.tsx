import React from 'react';

interface CurrencyDisplayProps {
    bcvRate?: number | null; // Acepta que bcvRate pueda ser null o undefined
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ bcvRate }) => {
    // Si bcvRate no es un número válido, muestra un texto provisional
    const displayRate = typeof bcvRate === 'number'
        ? bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '...';

    return (
        <div className="hidden sm:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Dólar (BCV):</span>
            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {displayRate} Bs.
            </span>
        </div>
    );
};

export default CurrencyDisplay;