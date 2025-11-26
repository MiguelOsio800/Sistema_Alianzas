import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { OFFICES } from '../../constants';
import { PrinterIcon, FileSpreadsheetIcon } from '../icons/Icons';

interface ReportFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportTitle: string;
}

const ReportFilterModal: React.FC<ReportFilterModalProps> = ({ isOpen, onClose, reportTitle }) => {
    const [outputType, setOutputType] = useState<'printer' | 'excel'>('excel');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Generar: ${reportTitle}`}>
            <div className="space-y-4">
                <Select label="Código de Oficina" defaultValue={OFFICES[0]}>
                    {OFFICES.map(office => (
                        <option key={office} value={office}>{office}</option>
                    ))}
                </Select>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Fecha desde" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                    <Input label="Fecha hasta" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de salida
                    </label>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setOutputType('printer')}
                            className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${outputType === 'printer' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Impresora
                        </button>
                        <button 
                            onClick={() => setOutputType('excel')}
                            className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${outputType === 'excel' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <FileSpreadsheetIcon className="w-5 h-5 mr-2" />
                            Archivo de Excel
                        </button>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700 mt-6">
                    <Button type="button" variant="secondary" onClick={onClose}>Regresar</Button>
                    <Button type="submit">Aceptar</Button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportFilterModal;