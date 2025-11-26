import React from 'react';
import Card, { CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { DownloadIcon, UploadIcon, DatabaseIcon, ExclamationTriangleIcon } from '../icons/Icons';
import { useToast } from '../ui/ToastProvider';

const DataAdministration: React.FC = () => {
    const { addToast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [restoreMode, setRestoreMode] = React.useState<'overwrite' | 'merge'>('merge');

    const handleBackup = () => {
        try {
            const backupData: { [key: string]: any } = {};
            const keysToBackup = ['isAuthenticated', 'currentUser', 'invoices', 'clients', 'companyInfo', 'categories', 'users', 'roles', 'vehicles', 'offices', 'shippingTypes', 'paymentMethods', 'expenses', 'inventory', 'expenseCategories', 'auditLog', 'assets', 'assetCategories', 'appErrors'];
            keysToBackup.forEach(key => {
                const item = localStorage.getItem(key);
                if (item) { backupData[key] = JSON.parse(item); }
            });

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            addToast({ type: 'success', title: 'Respaldo Exitoso', message: 'Los datos se han descargado.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Error de Respaldo', message: 'No se pudo generar el archivo.' });
            console.error(error);
        }
    };
    
    const handleRestoreClick = (mode: 'overwrite' | 'merge') => {
        setRestoreMode(mode);
        fileInputRef.current?.click(); 
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') throw new Error("Archivo no válido");
                const dataToRestore = JSON.parse(text);
                if (!dataToRestore.companyInfo || !dataToRestore.users) throw new Error("El archivo de respaldo es inválido o está corrupto.");

                if (restoreMode === 'overwrite') {
                    if(!window.confirm("ADVERTENCIA: ¿Está seguro de que desea sobrescribir TODOS los datos actuales con los del respaldo? Esta acción no se puede deshacer.")) {
                        if(e.target) e.target.value = ''; // Reset file input even on cancel
                        return;
                    }
                    
                    Object.keys(dataToRestore).forEach(key => {
                        localStorage.setItem(key, JSON.stringify(dataToRestore[key]));
                    });

                    addToast({ type: 'success', title: 'Restauración Completa', message: 'Datos sobrescritos. La aplicación se recargará.' });
                    setTimeout(() => window.location.reload(), 2000);

                } else { // Merge mode - safer implementation
                    const keysToMerge = ['invoices', 'clients', 'categories', 'users', 'roles', 'vehicles', 'offices', 'shippingTypes', 'paymentMethods', 'expenses', 'inventory', 'expenseCategories', 'auditLog', 'assets', 'assetCategories'];
                    
                    let newItemsCount = 0;
                    
                    // Scan for changes first
                    keysToMerge.forEach(key => {
                        const currentData: any[] = JSON.parse(localStorage.getItem(key) || '[]');
                        const backupData: any[] = dataToRestore[key] || [];

                        if (Array.isArray(currentData) && Array.isArray(backupData)) {
                             const currentIds = new Set(currentData.map(item => item.id));
                             const newItems = backupData.filter(item => item && item.id && !currentIds.has(item.id));
                             if (newItems.length > 0) {
                                 newItemsCount += newItems.length;
                             }
                        }
                    });

                    if (newItemsCount === 0) {
                        addToast({ type: 'info', title: 'Sin Cambios', message: 'El respaldo no contiene registros nuevos para fusionar.' });
                        return;
                    }

                    const confirmationMessage = `Se encontraron ${newItemsCount} registros nuevos para fusionar. Los datos existentes no se modificarán. ¿Desea continuar?`;

                    if (window.confirm(confirmationMessage)) {
                        // Apply changes
                        keysToMerge.forEach(key => {
                            if (dataToRestore[key]) {
                                const currentData: any[] = JSON.parse(localStorage.getItem(key) || '[]');
                                const backupData: any[] = dataToRestore[key];
                                if (Array.isArray(currentData) && Array.isArray(backupData)) {
                                    const currentIds = new Set(currentData.map(item => item.id));
                                    const newItems = backupData.filter(item => item && item.id && !currentIds.has(item.id));

                                    if (newItems.length > 0) {
                                        const mergedData = [...currentData, ...newItems];
                                        localStorage.setItem(key, JSON.stringify(mergedData));
                                    }
                                }
                            }
                        });
                        
                        addToast({ type: 'success', title: 'Fusión Completada', message: `Se añadieron ${newItemsCount} registros nuevos. La aplicación se recargará.` });
                        setTimeout(() => window.location.reload(), 2000);
                    }
                }
            } catch (error: any) {
                addToast({ type: 'error', title: 'Error de Restauración', message: error.message || 'No se pudo aplicar el respaldo.' });
            } finally {
                if(e.target) e.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle><div className="flex items-center"><DatabaseIcon className="w-5 h-5 mr-2" />Respaldo y Restauración</div></CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Guarde toda la información de la aplicación en un archivo, o restaure desde uno.
                </p>
            </CardHeader>
            <div className="space-y-4">
                 <Button onClick={handleBackup} className="w-full">
                    <DownloadIcon className="w-4 h-4 mr-2" /> Realizar Respaldo Completo
                </Button>
                
                 <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                     <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Opciones de Restauración:</p>
                     <div className="flex flex-col sm:flex-row gap-4">
                         <Button onClick={() => handleRestoreClick('merge')} variant="secondary" className="w-full">
                            <UploadIcon className="w-4 h-4 mr-2" /> Fusionar desde Respaldo (Recomendado)
                        </Button>
                        <Button onClick={() => handleRestoreClick('overwrite')} variant="danger" className="w-full">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" /> Restaurar y Sobrescribir (Peligroso)
                        </Button>
                     </div>
                     <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                         <strong>Fusionar:</strong> Añade datos del respaldo que no existen actualmente. No modifica ni elimina datos existentes.
                         <br/>
                         <strong>Restaurar y Sobrescribir:</strong> Borra toda la información actual y la reemplaza por la del respaldo.
                     </p>
                </div>

                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
        </Card>
    );
};

export default DataAdministration;