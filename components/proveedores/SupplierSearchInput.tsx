
import React, { useState, useEffect, useRef } from 'react';
import { Supplier } from '../../types';
import Input from '../ui/Input';

interface SupplierSearchInputProps {
    suppliers: Supplier[];
    onSupplierSelect: (supplier: Supplier) => void;
    currentRif: string;
    onRifChange: (value: string) => void;
}

const SupplierSearchInput: React.FC<SupplierSearchInputProps> = ({ suppliers, onSupplierSelect, currentRif, onRifChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Supplier[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setSearchTerm(currentRif);
    }, [currentRif]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        if (term && isFocused) {
            const filtered = suppliers.filter(supplier =>
                supplier.name.toLowerCase().includes(term) ||
                supplier.idNumber.toLowerCase().includes(term)
            ).slice(0, 10); // Limit results for performance
            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [searchTerm, suppliers, isFocused]);
    
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (supplier: Supplier) => {
        onSupplierSelect(supplier);
        setSearchTerm(supplier.idNumber);
        setResults([]);
        setIsFocused(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                label="Buscar Proveedor por RIF"
                value={searchTerm}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    onRifChange(e.target.value);
                }}
                onFocus={() => setIsFocused(true)}
                required
            />
            {isFocused && results.length > 0 && (
                <ul className="absolute z-20 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                    {results.map(supplier => (
                        <li
                            key={supplier.id}
                            className="px-4 py-2 cursor-pointer hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600"
                            onClick={() => handleSelect(supplier)}
                        >
                            <p className="font-semibold">{supplier.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.idNumber}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SupplierSearchInput;
