
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';

const SyncNotification = () => {
    const { syncStatus, lastSyncTime } = useAppContext();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (syncStatus === 'error') {
            setIsVisible(true);
            // Auto-hide after 5 seconds for errors
            const timer = setTimeout(() => setIsVisible(false), 5000);
            return () => clearTimeout(timer);
        } else if (syncStatus === 'success' && lastSyncTime) {
            // Show brief success notification
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [syncStatus, lastSyncTime]);

    if (!isVisible) return null;

    const getNotificationContent = () => {
        switch (syncStatus) {
            case 'success':
                return {
                    icon: '✓',
                    message: 'Data synced successfully',
                    className: 'bg-green-500 text-white'
                };
            case 'error':
                return {
                    icon: '⚠',
                    message: 'Sync failed - your data is safe locally',
                    className: 'bg-red-500 text-white'
                };
            default:
                return null;
        }
    };

    const content = getNotificationContent();
    if (!content) return null;

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${content.className} transition-all duration-300 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}>
            <span className="text-lg">{content.icon}</span>
            <span className="text-sm font-medium">{content.message}</span>
            <button 
                onClick={() => setIsVisible(false)}
                className="ml-2 text-white hover:text-gray-200 text-xl leading-none"
            >
                ×
            </button>
        </div>
    );
};

export default SyncNotification;
