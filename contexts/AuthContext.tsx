import React, { createContext, useContext, ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { apiFetch } from '../utils/api';

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: User | null;
    isAuthLoading: boolean;
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
    isWarningModalOpen: boolean;
    countdown: number;
    handleExtendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const WARNING_DURATION_SECONDS = 20; // 20 seconds countdown
    const [countdown, setCountdown] = useState(WARNING_DURATION_SECONDS);
    const [expiryTime, setExpiryTime] = useState<number | null>(null);

    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const clearTimers = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };

    const showWarningModal = useCallback(() => {
        setExpiryTime(Date.now() + WARNING_DURATION_SECONDS * 1000);
        setCountdown(WARNING_DURATION_SECONDS);
        setIsWarningModalOpen(true);
    }, []);

    const resetIdleTimer = useCallback(() => {
        clearTimers();
        // Set idle timeout. Session will warn after 5 minutes of inactivity.
        const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
        idleTimerRef.current = setTimeout(showWarningModal, IDLE_TIMEOUT_MS);
    }, [showWarningModal]);

    useEffect(() => {
        if (isAuthenticated) {
            const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
            const eventHandler = () => resetIdleTimer();
            events.forEach(event => window.addEventListener(event, eventHandler));
            resetIdleTimer();

            return () => {
                events.forEach(event => window.removeEventListener(event, eventHandler));
                clearTimers();
            };
        } else {
            clearTimers();
            setIsWarningModalOpen(false);
            setExpiryTime(null);
        }
    }, [isAuthenticated, resetIdleTimer]);

    useEffect(() => {
        if (isWarningModalOpen && expiryTime) {
            countdownTimerRef.current = setInterval(() => {
                const now = Date.now();
                const remainingSeconds = Math.round((expiryTime - now) / 1000);
                setCountdown(Math.max(0, remainingSeconds));
            }, 1000);
        }
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        };
    }, [isWarningModalOpen, expiryTime]);

    const handleExtendSession = useCallback(async () => {
        try {
            // Make a lightweight API call to keep the session alive on the backend
            await apiFetch('/auth/profile');
            
            // If successful, reset everything
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            setIsWarningModalOpen(false);
            setExpiryTime(null);
            resetIdleTimer();
        } catch (error) {
            // If the token expired just as they clicked, the API call will fail.
            // The countdown will continue to 0 and the effect in App.tsx will log them out.
            console.error("Failed to extend session, logging out:", error);
        }
    }, [resetIdleTimer]);


    useEffect(() => {
        const validateSession = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const userProfile = await apiFetch<User>('/auth/profile');
                    if (userProfile && userProfile.id) {
                        setCurrentUser(userProfile);
                        setIsAuthenticated(true);
                    } else {
                        throw new Error("Invalid profile data");
                    }
                } catch (error) {
                    console.error("Session validation failed:", error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setIsAuthenticated(false);
                    setCurrentUser(null);
                }
            }
            setIsAuthLoading(false);
        };

        validateSession();
    }, []);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            isAuthLoading, 
            currentUser, 
            setIsAuthenticated, 
            setCurrentUser,
            isWarningModalOpen,
            countdown,
            handleExtendSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};