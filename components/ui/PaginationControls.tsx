
import React from 'react';
import Button from './Button';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
    if (totalPages <= 1) return null;

    const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between mt-4 px-2 py-3 border-t dark:border-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando <span className="font-medium">{startItem}</span> a <span className="font-medium">{endItem}</span> de <span className="font-medium">{totalItems}</span> resultados
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} variant="secondary" size="sm">
                    Anterior
                </Button>
                <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
                    Página {currentPage} de {totalPages}
                </span>
                <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} variant="secondary" size="sm">
                    Siguiente
                </Button>
            </div>
        </div>
    );
};

export default PaginationControls;
