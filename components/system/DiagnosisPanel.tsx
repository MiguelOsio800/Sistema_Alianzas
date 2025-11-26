
import React from 'react';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { AppError } from '../../types';
import { TrashIcon, ClockIcon } from '../icons/Icons';

interface DiagnosisPanelProps {
    appErrors: AppError[];
    setAppErrors: React.Dispatch<React.SetStateAction<AppError[]>>;
    addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string; }) => void;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ appErrors, setAppErrors, addToast }) => {

    const handleClearErrors = () => {
        setAppErrors([]);
        addToast({ type: 'success', title: 'Registro Limpio', message: 'Se ha borrado el registro de errores.' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Panel de Diagnóstico del Sistema</CardTitle>
            </CardHeader>
            <div className="space-y-6">
                {/* Error Log */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Registro de Errores Críticos de la Aplicación</h3>
                        <Button onClick={handleClearErrors} variant="danger" size="sm" disabled={appErrors.length === 0}>
                            <TrashIcon className="w-4 h-4 mr-1" /> Limpiar Registro
                        </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 border dark:border-gray-700 rounded-md p-2">
                        {appErrors.length > 0 ? appErrors.map(err => (
                            <details key={err.id} className="text-xs bg-white dark:bg-gray-900 p-2 rounded-md shadow-sm">
                                <summary className="cursor-pointer font-mono text-red-600 dark:text-red-400 flex justify-between items-center">
                                    <span>{err.message}</span>
                                    <span className="text-gray-400 dark:text-gray-500 flex items-center"><ClockIcon className="w-3 h-3 mr-1" /> {new Date(err.timestamp).toLocaleTimeString()}</span>
                                </summary>
                                <div className="mt-2 pt-2 border-t dark:border-gray-700 text-gray-600 dark:text-gray-400 font-mono">
                                    <p><strong>Source:</strong> {err.source}</p>
                                    <p><strong>Line:</strong> {err.lineno}, <strong>Col:</strong> {err.colno}</p>
                                    <pre className="mt-1 whitespace-pre-wrap text-red-400/80 bg-red-900/10 p-1 rounded">{err.error}</pre>
                                </div>
                            </details>
                        )) : (
                            <p className="text-center py-4 text-gray-500 dark:text-gray-400">No hay errores registrados.</p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default DiagnosisPanel;
