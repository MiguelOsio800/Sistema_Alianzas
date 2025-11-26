import React from 'react';
import Card, { CardTitle } from '../ui/Card';
import { Report } from '../../types';
import { FileTextIcon } from '../icons/Icons';

const ReportCard: React.FC<{ report: Report; onSelect: () => void }> = ({ report, onSelect }) => (
    <button
        onClick={onSelect}
        className="text-left p-4 bg-white dark:bg-gray-800/50 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
        <div className="flex items-center">
            <FileTextIcon className="h-6 w-6 mr-4 text-primary-500" />
            <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{report.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ver datos y exportar</p>
            </div>
        </div>
    </button>
);


const ReportsView: React.FC<{reports: Report[]}> = ({ reports }) => {

    const handleReportSelect = (reportId: string) => {
        window.location.hash = `report-detail/${reportId}`;
    };

    return (
        <>
            <Card>
                <CardTitle>Reportes del Sistema</CardTitle>
                <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">Seleccione un reporte para visualizar sus datos.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onSelect={() => handleReportSelect(report.id)}
                        />
                    ))}
                </div>
            </Card>
        </>
    );
};

export default ReportsView;
