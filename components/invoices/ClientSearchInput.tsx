import React, { useState, useEffect, useRef } from 'react';
import { Client, ShippingGuide } from '../../types';
import Input from '../ui/Input';

interface ClientSearchInputProps {
    clients: Client[];
    onClientSelect: (client: Client) => void;
    party: 'sender' | 'receiver';
    guide: ShippingGuide;
    onClientChange: (party: 'sender' | 'receiver', field: keyof Client, value: string) => void;
    error?: string;
}

const ClientSearchInput: React.FC<ClientSearchInputProps> = ({ clients, onClientSelect, party, guide, onClientChange, error }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Client[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const partyData = guide[party];

    useEffect(() => {
        setSearchTerm(partyData?.idNumber || '');
    }, [partyData?.idNumber]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        if (term) {
            const filtered = clients.filter(client =>
                client.name.toLowerCase().includes(term) ||
                client.idNumber.toLowerCase().includes(term) ||
                (client.email && client.email.toLowerCase().includes(term))
            );

            // Sort results to prioritize 'startsWith' matches
            filtered.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aId = a.idNumber.toLowerCase();
                const bId = b.idNumber.toLowerCase();

                const aStartsWith = aName.startsWith(term) || aId.startsWith(term);
                const bStartsWith = bName.startsWith(term) || bId.startsWith(term);

                if (aStartsWith && !bStartsWith) return -1; // a comes first
                if (!aStartsWith && bStartsWith) return 1;  // b comes first
                
                // If both start with or both don't, sort alphabetically by name
                return aName.localeCompare(bName);
            });

            setResults(filtered);
        } else {
            setResults([]);
        }
    }, [searchTerm, clients]);
    
     useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);


    const handleSelect = (client: Client) => {
        onClientSelect(client);
        setSearchTerm(client.idNumber);
        setResults([]);
        setIsFocused(false);
    };

    const idLabel = partyData?.clientType === 'empresa' ? 'RIF' : 'C.I.';

    return (
        <div className="relative" ref={wrapperRef}>
            <Input
                label={`Buscar Cliente por ${idLabel}, Nombre o Email`}
                value={searchTerm}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    onClientChange(party, 'idNumber', e.target.value);
                }}
                onFocus={() => setIsFocused(true)}
                error={error}
            />
            {isFocused && results.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-auto shadow-lg">
                    {results.map(client => (
                        <li
                            key={client.id}
                            className="px-4 py-2 cursor-pointer hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600"
                            onClick={() => handleSelect(client)}
                        >
                            <p className="font-semibold">{client.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{client.idNumber}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ClientSearchInput;
