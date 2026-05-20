import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

interface GoogleTokenClient {
  callback?: (resp: { error?: string }) => void | Promise<void>;
  requestAccessToken: (options: { prompt: string }) => void;
}

export function useGmailSync() {
  const [isGmailSyncing, setIsGmailSyncing] = useState(false);
  const [isGoogleApiLoaded, setIsGoogleApiLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState<GoogleTokenClient | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const initGoogle = async () => {
      try {
        if (!API_KEY || !CLIENT_ID) {
          console.warn("[Gmail Sync] Google API keys are not configured. Sync will be unavailable.");
          return;
        }
        await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        const tc = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: () => {},
        });
        setTokenClient(tc);
        setIsGoogleApiLoaded(true);
      } catch (err) {
        console.error("[Gmail Sync] Failed to initialize Google API:", err);
      }
    };

    interval = setInterval(() => {
      if (window.gapi && window.google) {
        if (interval) clearInterval(interval);
        window.gapi.load('client', initGoogle);
      }
    }, 300);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const listAndSyncMessages = async (token: string) => {
    const response = await window.gapi.client.gmail.users.messages.list({
      userId: 'me', maxResults: 25, labelIds: ['INBOX'],
    });

    const messages = response.result.messages;
    if (!messages?.length) return 0;

    const apiBase = import.meta.env.VITE_API_URL || '';
    let syncedCount = 0;

    for (const msg of messages) {
      const full = await window.gapi.client.gmail.users.messages.get({
        userId: 'me', id: msg.id, format: 'full',
      });
      
      interface GmailHeader {
        name: string;
        value: string;
      }
      interface GmailPart {
        mimeType: string;
        body?: {
          data?: string;
        };
      }

      const headers = (full.result.payload.headers || []) as GmailHeader[];
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const date = headers.find((h) => h.name === 'Date')?.value || '';
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';

      let body = '';
      if (full.result.payload.parts) {
        const parts = full.result.payload.parts as GmailPart[];
        const part = parts.find((p) => p.mimeType === 'text/plain');
        if (part?.body?.data) {
          body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      } else if (full.result.payload.body?.data) {
        body = atob(full.result.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }

      await fetch(`${apiBase}/api/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ MessageId: msg.id, from, date, subject, body }),
      });
      syncedCount++;
    }
    return syncedCount;
  };

  const handleGmailSync = (onSuccess?: () => void) => {
    const token = localStorage.getItem('nexusai_token');
    
    // Allow syncing if we have a token, even if `user` isn't fully loaded in state yet during auth flows
    if (!token) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "Please sign in or create an account first to sync emails."
      });
      return;
    }

    if (!isGoogleApiLoaded || !tokenClient) {
      toast({
        variant: "destructive",
        title: "Not ready",
        description: "Google APIs are still loading. Please try again in a moment."
      });
      return;
    }

    tokenClient.callback = async (resp: { error?: string }) => {
      if (resp.error) {
        toast({
          variant: "destructive",
          title: "Authorization Failed",
          description: "Google authorization was cancelled or failed."
        });
        return;
      }
      
      setIsGmailSyncing(true);
      try {
        const count = await listAndSyncMessages(token);
        toast({
          title: "Sync Complete",
          description: `Successfully extracted ${count} job emails and sent them for AI processing.`
        });
        if (onSuccess) onSuccess();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description: "Failed to sync Gmail: " + errorMessage
        });
      } finally {
        setIsGmailSyncing(false);
      }
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  };

  return { handleGmailSync, isGmailSyncing, isGoogleApiLoaded };
}
