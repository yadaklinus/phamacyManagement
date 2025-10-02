"use client"

import { useEffect, useState } from "react"
import { useOnlineStatus } from "./check-online"

interface SyncStatus {
  status: boolean;
  loading: boolean;
  error?: string;
  isConnectionError?: boolean;
  lastSyncTime?: Date;
  retryCount?: number;
}

export function useAutoSync(url = "/api/syncNew", interval = 90000) {
  const [syncState, setSyncState] = useState<SyncStatus>({
    status: false,
    loading: true,
    retryCount: 0
  });
  const { online } = useOnlineStatus()

  useEffect(() => {
    if (!online) {
      setSyncState(prev => ({
        ...prev,
        status: false,
        loading: false,
        error: "No internet connection",
        isConnectionError: true
      }));
      return;
    }

    let timer: NodeJS.Timeout
    let retryTimer: NodeJS.Timeout

    async function performSync() {
      setSyncState(prev => ({ ...prev, loading: true, error: undefined }));
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const res = await fetch(url, { 
          method: "POST",
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          setSyncState(prev => ({
            ...prev,
            status: true,
            loading: false,
            error: undefined,
            lastSyncTime: new Date(),
            retryCount: 0
          }));
        } else {
          // Try to get error details from response
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          let isConnectionError = false;

          try {
            const errorData = await res.json();
            if (errorData.error) {
              errorMessage = errorData.error;
              isConnectionError = errorData.isConnectionError || false;
            }
          } catch {
            // If we can't parse the error response, use the default message
          }

          setSyncState(prev => ({
            ...prev,
            status: false,
            loading: false,
            error: errorMessage,
            isConnectionError,
            retryCount: prev.retryCount ? prev.retryCount + 1 : 1
          }));
        }
      } catch (error) {
        let errorMessage = "Sync failed";
        let isConnectionError = true;

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = "Sync timeout - operation took too long";
          } else if (error.message.includes('fetch')) {
            errorMessage = "Network error - check your connection";
          } else {
            errorMessage = error.message;
          }
        }

        setSyncState(prev => ({
          ...prev,
          status: false,
          loading: false,
          error: errorMessage,
          isConnectionError,
          retryCount: prev.retryCount ? prev.retryCount + 1 : 1
        }));
      }
    }

    // Retry logic with exponential backoff
    function scheduleRetry() {
      const retryDelay = Math.min(interval * Math.pow(2, syncState.retryCount || 0), 60000); // Max 1 minute
      retryTimer = setTimeout(performSync, retryDelay);
    }

    // Initial sync
    performSync();

    // Set up regular interval
    timer = setInterval(() => {
      if (syncState.status) {
        performSync();
      } else {
        // If sync is failing, use retry logic
        scheduleRetry();
      }
    }, interval);

    return () => {
      clearInterval(timer);
      clearTimeout(retryTimer);
    };
  }, [url, interval, online, syncState.retryCount]);

  return {
    status: syncState.status,
    loading: syncState.loading,
    error: syncState.error,
    isConnectionError: syncState.isConnectionError,
    lastSyncTime: syncState.lastSyncTime,
    retryCount: syncState.retryCount
  };
}