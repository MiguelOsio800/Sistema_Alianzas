
import { useState, useMemo, useEffect } from 'react';

const usePagination = <T,>(data: T[], itemsPerPage: number) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(() => {
        if (data.length === 0) return 1;
        return Math.ceil(data.length / itemsPerPage);
    }, [data, itemsPerPage]);
    
    useEffect(() => {
        // Reset to page 1 if filters change and current page becomes invalid
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages]);


    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    return {
        paginatedData,
        currentPage,
        totalPages,
        setCurrentPage,
        totalItems: data.length,
    };
};

export default usePagination;
