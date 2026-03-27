/**
 * @file src/hooks/useNotifications.ts
 * @description Manages browser notification permissions and Service Worker registration.
 */

import { useEffect, useState } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then((registration) => {
                    console.log('SW registered: ', registration);
                }).catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
            });
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications.');
            return;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    };

    return { permission, requestPermission };
};
