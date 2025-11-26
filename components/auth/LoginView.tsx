

import React, { useState, useEffect, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { UserIcon, LockIcon, PackageIcon } from '../icons/Icons';
import { CompanyInfo } from '../../types';

interface LoginViewProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => void;
  companyInfo: CompanyInfo;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, companyInfo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ username?: string, password?: string }>({});
  const rememberedUserOnLoad = useRef(localStorage.getItem('rememberedUser'));

  useEffect(() => {
    if (rememberedUserOnLoad.current) {
        setUsername(rememberedUserOnLoad.current);
        setRememberMe(true);
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUsername = e.target.value;
      setUsername(newUsername);
      
      if (rememberedUserOnLoad.current && newUsername !== rememberedUserOnLoad.current) {
          setRememberMe(false);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { username?: string, password?: string } = {};
    if (!username.trim()) newErrors.username = 'El campo de usuario es requerido.';
    if (!password.trim()) newErrors.password = 'El campo de contraseña es requerido.';

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setErrors({});
    onLogin(username, password, rememberMe);
  };


  const backgroundStyle = companyInfo.loginImageUrl ? { backgroundImage: `url(${companyInfo.loginImageUrl})` } : {};


  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Left Panel - Branding */}
       <div 
            className="hidden lg:flex w-1/2 relative items-center justify-center bg-primary-800 bg-cover bg-center"
            style={backgroundStyle}
        >
             {/* Overlay */}
            <div className="absolute inset-0 bg-primary-900 opacity-60"></div>
            <div className="relative z-10 text-center text-white p-12">
                {companyInfo.logoUrl ? (
                    <div className="mx-auto bg-white/20 p-4 rounded-2xl backdrop-blur-sm inline-block shadow-lg">
                        <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="h-20 object-contain" style={{ borderRadius: '3%' }} />
                    </div>
                ) : (
                    <PackageIcon className="mx-auto h-20 w-20 text-primary-300" />
                )}
                <h1 className="mt-6 text-4xl font-extrabold tracking-tight">{companyInfo.name}</h1>
                <p className="mt-4 text-lg text-primary-200">
                    La solución integral para la gestión de sus envíos. Eficiencia, control y seguridad en un solo lugar.
                </p>
            </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Accede a tu cuenta para gestionar la logística.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm">
              <Input
                id="username"
                label="Usuario"
                icon={<UserIcon className="w-5 h-5 text-gray-400" />}
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={handleUsernameChange}
                required
                error={errors.username}
              />
            </div>
             <div className="rounded-md shadow-sm mt-4">
               <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    icon={<LockIcon className="w-5 h-5 text-gray-400" />}
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    error={errors.password}
                />
             </div>


            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Recordarme
                </label>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </div>
          </form>
           <div className="text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 pt-6 mt-8 space-y-2">
                <p>
                    Sistema desarrollado por <strong>Cooperativa Sysven</strong>.
                    <br />
                    Soporte técnico: 0414-3904180
                </p>
                <p className="font-semibold">
                    © 2025 {companyInfo.name}. Todos los derechos reservados.
                </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;