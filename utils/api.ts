
const API_BASE_URL = 'https://4wt9b8zl-5000.use2.devtunnels.ms/api';

interface ApiFetchOptions extends RequestInit {}

// Helper to perform the refresh token call
const refreshToken = async (): Promise<string | null> => {
    const currentRefreshToken = localStorage.getItem('refreshToken');
    if (!currentRefreshToken) return null;

    try {
        console.log('🔄 Intentando refrescar token...');
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        if (!response.ok) {
            throw new Error('Refresh token failed');
        }

        const { accessToken, refreshToken: newRefreshToken } = await response.json();
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
             localStorage.setItem('refreshToken', newRefreshToken);
        }
        console.log('✅ Token refrescado exitosamente');
        return accessToken;
    } catch (error) {
        console.error("❌ Error al refrescar token:", error);
        // Clear tokens if refresh fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Force logout by reloading the page. AuthContext will see no tokens and show login.
        window.location.reload(); 
        return null;
    }
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export const apiFetch = async <T>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> => {
    const token = localStorage.getItem('accessToken');
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Header opcional para evitar la página de advertencia de algunos túneles de desarrollo
    headers.set('ngrok-skip-browser-warning', 'true');

    const fetchOptions: ApiFetchOptions = {
        ...options,
        headers,
    };

    // Debug Log
    // console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);

    try {
        let response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        if (response.status === 401) {
            console.warn(`⚠️ 401 No autorizado en ${endpoint}. Intentando refresh...`);
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = refreshToken();
            }

            const newAccessToken = await refreshPromise;
            isRefreshing = false;
            refreshPromise = null;

            if (newAccessToken) {
                // Retry the original request with the new token
                headers.set('Authorization', `Bearer ${newAccessToken}`);
                const retryOptions: ApiFetchOptions = { ...fetchOptions, headers };
                response = await fetch(`${API_BASE_URL}${endpoint}`, retryOptions);
            } else {
                 // If refresh fails, we will have been redirected, but throw to stop current execution
                throw new Error("Session expired. Please log in again.");
            }
        }

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.message) {
                    errorMessage = errorBody.message;
                } else if (typeof errorBody === 'string') {
                    errorMessage = errorBody;
                }
            } catch (e) {
                // The response might not be JSON, keep the default error message
            }
            
            // Only log error if it's not a 404 (Not Found) or 403 (Forbidden)
            // Also suppress logging if the message explicitly mentions permissions
            if (response.status !== 404 && response.status !== 403 && !errorMessage.includes('No tiene los permisos')) {
                console.error(`❌ API Error en ${endpoint}:`, errorMessage);
            }
            
            throw new Error(errorMessage);
        }
        
        // Handle 204 No Content
        if (response.status === 204) {
            return {} as T;
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            return data;
        }
        
        return {} as T;
    } catch (error: any) {
        let msg = error.message;
        // Check for common network errors including the custom one we might have set before
        if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Connection refused')) {
            msg = 'No se pudo conectar al servidor. Verifique la URL del backend y su conexión a internet.';
        }
        
        // If it's a 403/permission error thrown above, suppress the warning log to keep console clean
        if (!msg.includes('403') && !msg.includes('404') && !msg.includes('No tiene los permisos')) {
             console.warn(`🔥 Network/Fetch Error en ${endpoint}:`, msg);
        }
       
        throw new Error(msg);
    }
};
