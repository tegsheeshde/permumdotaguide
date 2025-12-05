import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Version Checker Component
 * Detects when app has been updated and prompts user to refresh
 */
export default function VersionChecker() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check for updates every 5 minutes
    const checkForUpdates = async () => {
      try {
        // Fetch index.html with cache-busting query param
        const response = await fetch(`/index.html?v=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        const html = await response.text();

        // Store initial version hash
        const currentHash = localStorage.getItem('appVersionHash');
        const newHash = hashCode(html);

        if (currentHash && currentHash !== newHash.toString()) {
          // New version detected
          setShowUpdate(true);
        } else if (!currentHash) {
          // First load, store current version
          localStorage.setItem('appVersionHash', newHash.toString());
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    // Initial check after 10 seconds
    const initialTimer = setTimeout(checkForUpdates, 10000);

    // Check every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Simple hash function for version detection
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }

    // Update version hash
    fetch(`/index.html?v=${Date.now()}`, { cache: 'no-cache' })
      .then(res => res.text())
      .then(html => {
        localStorage.setItem('appVersionHash', hashCode(html).toString());

        // Hard refresh
        setTimeout(() => {
          window.location.reload(true);
        }, 500);
      });
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Update hash to prevent showing again until next actual update
    fetch(`/index.html?v=${Date.now()}`, { cache: 'no-cache' })
      .then(res => res.text())
      .then(html => {
        localStorage.setItem('appVersionHash', hashCode(html).toString());
      });
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-2xl p-4 max-w-sm border-2 border-purple-400">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-5 h-5" />
              <h3 className="font-bold text-lg">Update Available!</h3>
            </div>
            <p className="text-sm text-purple-100 mb-3">
              A new version of the app is available. Refresh to get the latest features and fixes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors disabled:opacity-50"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh Now
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg font-semibold transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-purple-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
