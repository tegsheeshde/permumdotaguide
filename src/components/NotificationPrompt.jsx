import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { requestNotificationPermission, areNotificationsEnabled } from "../notifications";

/**
 * NotificationPrompt Component
 * Prompts users to enable push notifications
 */
export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are already enabled
    const enabled = areNotificationsEnabled();
    setIsEnabled(enabled);

    // Show prompt if notifications are not enabled and user hasn't dismissed it
    const dismissed = localStorage.getItem('notification_prompt_dismissed');
    if (!enabled && !dismissed) {
      // Show prompt after 5 seconds delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    const granted = await requestNotificationPermission();
    setIsLoading(false);

    if (granted) {
      setIsEnabled(true);
      setShowPrompt(false);
      alert('✅ Notifications enabled! You\'ll now receive updates for new posts and messages.');
    } else {
      alert('❌ Unable to enable notifications. Please check your browser settings.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notification_prompt_dismissed', 'true');
  };

  const handleToggleNotifications = async () => {
    if (isEnabled) {
      // Can't programmatically disable, show instructions
      alert(
        'To disable notifications:\n\n' +
        '1. Click the lock icon in your browser\'s address bar\n' +
        '2. Find "Notifications" setting\n' +
        '3. Change it to "Block"'
      );
    } else {
      await handleEnableNotifications();
    }
  };

  if (!showPrompt && isEnabled) {
    // Show small indicator when enabled
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={handleToggleNotifications}
          className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-colors"
          title="Notifications enabled"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-2xl border-2 border-purple-400/50 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-full">
              <Bell className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            Stay Updated!
          </h3>

          {/* Description */}
          <p className="text-white/90 text-sm text-center mb-4">
            Enable notifications to get instant updates when:
          </p>

          <ul className="text-white/80 text-xs space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              <span>Someone posts in the feed</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              <span>You get a new chat message</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              <span>Someone mentions you</span>
            </li>
          </ul>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading}
              className="w-full py-3 bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-white/80 hover:text-white text-sm font-semibold transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400"></div>
      </div>
    </div>
  );
}
