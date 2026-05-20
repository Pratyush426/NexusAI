/// <reference types="vite/client" />

interface Window {
  gapi: {
    load: (apiName: string, callback: () => void) => void;
    client: {
      init: (args: { apiKey: string; discoveryDocs: string[] }) => Promise<void>;
      getToken: () => unknown;
      gmail: {
        users: {
          messages: {
            list: (args: { userId: string; maxResults: number; labelIds: string[] }) => Promise<{
              result: {
                messages?: Array<{ id: string; threadId: string }>;
              };
            }>;
            get: (args: { userId: string; id: string; format: string }) => Promise<{
              result: {
                payload: {
                  headers: Array<{ name: string; value: string }>;
                  parts?: Array<{ mimeType: string; body?: { data?: string } }>;
                  body?: { data?: string };
                };
              };
            }>;
          };
        };
      };
    };
  };
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (args: {
          client_id: string;
          scope: string;
          callback: (resp: { error?: string }) => void | Promise<void>;
        }) => {
          requestAccessToken: (options: { prompt: string }) => void;
          callback?: (resp: { error?: string }) => void | Promise<void>;
        };
      };
    };
  };
}
