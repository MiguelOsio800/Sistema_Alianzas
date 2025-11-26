
import React from 'react';
import DiagnosisPanel from './DiagnosisPanel';
import CleanupTool from './CleanupTool';
import DataAdministration from './DataAdministration';
import { AppError, Invoice, Vehicle, Expense, Office, Permissions } from '../../types';
import { useToast } from '../ui/ToastProvider';

interface SystemViewProps {
    appErrors: AppError[];
    setAppErrors: React.Dispatch<React.SetStateAction<AppError[]>>;
    addToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message: string; }) => void;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    vehicles: Vehicle[];
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    offices: Office[];
    permissions: Permissions;
}

const SystemView: React.FC<SystemViewProps> = (props) => {
    return (
        <div className="space-y-8">
            <DiagnosisPanel appErrors={props.appErrors} setAppErrors={props.setAppErrors} addToast={props.addToast} />
            <CleanupTool invoices={props.invoices} setInvoices={props.setInvoices} vehicles={props.vehicles} expenses={props.expenses} setExpenses={props.setExpenses} offices={props.offices} />
            {props.permissions['system.backupRestore'] && <DataAdministration />}
        </div>
    );
};

export default SystemView;
