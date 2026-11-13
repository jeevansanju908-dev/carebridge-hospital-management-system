import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  role: 'patient' | 'hospital';
  onSuccess: (authData: {
    credential?: string;
    accessToken?: string;
    token?: string;
  }) => void;
  onError: (errorMessage: string) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  role,
  onSuccess,
  onError,
  disabled = false,
}) => {
  const [clientId, setClientId] = useState<string>(() => {
    const envId = ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '').trim();
    if (
      envId &&
      envId.endsWith('.apps.googleusercontent.com') &&
      !envId.startsWith('YOUR_')
    ) {
      return envId;
    }
    return '';
  });
  const [configChecked, setConfigChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/google/config');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.configured && data.clientId) {
            setClientId(String(data.clientId).trim());
          }
        }
      } catch {
        // Handled cleanly on click if config is unavailable
      } finally {
        if (mounted) setConfigChecked(true);
      }
    };
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  // Listen for direct Google OAuth popup postMessage callback fallback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'GOOGLE_OAUTH_CALLBACK') return;

      setIsLoading(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      popupRef.current = null;

      if (event.data.error) {
        onError(`Google sign-in was cancelled or failed (${event.data.error}).`);
        return;
      }

      const token = event.data.idToken || event.data.accessToken;
      if (token) {
        onSuccess({
          credential: event.data.idToken || undefined,
          accessToken: event.data.accessToken || undefined,
          token,
        });
      } else {
        onError('Google authentication did not return a valid credential.');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess, onError]);

  const openDirectGoogleOAuthWindow = (activeClientId: string) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      activeClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      'openid email profile'
    )}&prompt=select_account&include_granted_scopes=true`;

    const width = 500;
    const height = 650;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      authUrl,
      'CareBridgeGoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,location=0,menubar=0`
    );

    if (!popup) {
      setIsLoading(false);
      onError('Popup window was blocked by your browser. Please allow popups for Google sign-in.');
      return;
    }

    popupRef.current = popup;
    const closeCheckTimer = setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(closeCheckTimer);
        popupRef.current = null;
        setIsLoading(false);
      }
    }, 600);
  };

  const handleGoogleSignInClick = () => {
    const activeClientId = clientId.trim();
    if (!activeClientId || !activeClientId.endsWith('.apps.googleusercontent.com')) {
      onError(
        'Google Sign-In is not yet configured on this server. Please configure the GOOGLE_CLIENT_ID environment variable.'
      );
      return;
    }

    setIsLoading(true);
    const google = (window as any).google;

    // Prefer official Google Identity Services OAuth2 Token Client with prompt=select_account
    // so Google displays all signed-in Gmail accounts + "Use another account".
    if (google?.accounts?.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: (tokenResponse: any) => {
            if (tokenResponse?.error) {
              setIsLoading(false);
              onError(
                tokenResponse.error_description ||
                  `Google authentication failed: ${tokenResponse.error}`
              );
              return;
            }

            if (tokenResponse?.access_token) {
              setIsLoading(false);
              onSuccess({
                accessToken: tokenResponse.access_token,
                token: tokenResponse.access_token,
              });
            } else {
              setIsLoading(false);
              onError('No authentication token received from Google.');
            }
          },
          error_callback: (err: any) => {
            setIsLoading(false);
            if (err?.type === 'popup_closed') {
              onError('Google sign-in window was closed before completing authentication.');
            } else if (err?.type === 'popup_failed_to_open') {
              openDirectGoogleOAuthWindow(activeClientId);
            } else {
              onError('Unable to complete Google authentication. Please try again.');
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // Fall through to direct Google OAuth popup
      }
    }

    openDirectGoogleOAuthWindow(activeClientId);
  };

  return (
    <div className="w-full space-y-2.5">
      <button
        type="button"
        onClick={handleGoogleSignInClick}
        disabled={disabled || isLoading || !configChecked}
        className={`w-full py-3.5 px-4 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-md transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
          role === 'hospital'
            ? 'hover:border-blue-500 hover:bg-blue-50/40'
            : 'hover:border-sky-400 hover:bg-sky-50/40'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span
          className={
            role === 'hospital'
              ? 'group-hover:text-[#1e40af] transition-colors'
              : 'group-hover:text-[#0284c7] transition-colors'
          }
        >
          {isLoading ? 'Opening Google Account Selection...' : 'Continue with Google'}
        </span>
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Verified Google Account Authentication</span>
      </div>
    </div>
  );
};
