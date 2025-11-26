import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { LogOutIcon, ClockIcon } from '../icons/Icons';

interface SessionWarningModalProps {
    isOpen: boolean;
    countdown: number;
    onExtend: () => void;
    onLogout: () => void;
}

const SessionWarningModal: React.FC<SessionWarningModalProps> = ({ isOpen, countdown, onExtend, onLogout }) => {
    if (!isOpen) {
        return null;
    }

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    return (
        <Modal isOpen={isOpen} onClose={() => {}} title="Alerta de Inactividad" size="md">
            <div className="text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-yellow-500" />
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Su sesión está a punto de expirar</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Por motivos de seguridad, su sesión se cerrará automáticamente por inactividad en:
                </p>
                <p className="my-4 text-4xl font-bold text-primary-600 dark:text-primary-400">
                    {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Haga clic en "Extender Sesión" para continuar trabajando.
                </p>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
                <Button variant="secondary" onClick={onLogout}>
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                </Button>
                <Button onClick={onExtend}>
                    Extender Sesión
                </Button>
            </div>
        </Modal>
    );
};

export default SessionWarningModal;
