
import React, { useState, useMemo } from 'react';
import { AuditLog, User } from '../../types';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { SearchIcon } from '../icons/Icons';
import usePagination from '../../hooks/usePagination';
import PaginationControls from '../ui/PaginationControls';

const actionColors: { [key: string]: string } = {
    CREAR: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
    ACTUALIZAR: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
    ELIMINAR: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
    CAMBIAR: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
    INICIO_SESION: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300',
    CIERRE_SESION: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300',
    DESPACHAR: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300',
    FINALIZAR: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
};

const getActionColor = (action: string) => {
    const actionPrefix = action.split('_')[0];
    return actionColors[actionPrefix] || 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300';
};

interface AuditLogViewProps {
    auditLog: AuditLog[];
    users: User[];
}

const ITEMS_PER_PAGE = 25;

const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLog, users }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        return auditLog.filter(log => {
            const logDate = new Date(log.timestamp);
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;

            if (start && logDate < start) return false;
            if (end && logDate > end) return false;
            if (selectedUserId && log.userId !== selectedUserId) return false;
            if (searchTerm && !(
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.userName.toLowerCase().includes(searchTerm.toLowerCase())
            )) return false;

            return true;
        });
    }, [auditLog, startDate, endDate, selectedUserId, searchTerm]);

    const { 
        paginatedData, 
        currentPage, 
        totalPages, 
        setCurrentPage,
        totalItems
    } = usePagination(filteredLogs, ITEMS_PER_PAGE);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Registro de Auditoría del Sistema</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitoreo de todas las acciones importantes realizadas en la aplicación.</p>
                <div className="mt-4 flex flex-col md:flex-row md:flex-wrap gap-4 items-end">
                    <div className="w-full sm:w-auto">
                        <Input label="Desde" type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Input label="Hasta" type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div className="w-full md:w-auto md:flex-grow lg:flex-grow-0 lg:w-1/4">
                        <Select label="Usuario" id="user-filter" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                            <option value="">Todos los Usuarios</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Select>
                    </div>
                    <div className="w-full md:w-auto md:flex-grow lg:flex-grow-0 lg:w-1/4">
                        <Input label="Buscar" id="search" placeholder="Por acción o detalle..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={<SearchIcon className="w-4 h-4 text-gray-400"/>} />
                    </div>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha y Hora</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acción</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalles</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                    {new Date(log.timestamp).toLocaleString('es-VE')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{log.userName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {paginatedData.length === 0 && <p className="text-center py-10 text-gray-500 dark:text-gray-400">No hay registros de auditoría que coincidan con los filtros.</p>}
            </div>
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
            />
        </Card>
    );
};

export default AuditLogView;
