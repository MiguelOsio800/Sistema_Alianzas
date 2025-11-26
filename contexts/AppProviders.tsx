
import React, { ReactNode } from 'react';
import ToastProvider from '../components/ui/ToastProvider';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import { ConfigProvider } from './ConfigContext';
import { SystemProvider } from './SystemContext';

const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ToastProvider>
            <AuthProvider>
                <SystemProvider>
                    <ConfigProvider>
                        <DataProvider>
                            {children}
                        </DataProvider>
                    </ConfigProvider>
                </SystemProvider>
            </AuthProvider>
        </ToastProvider>
    );
};

export default AppProviders;
