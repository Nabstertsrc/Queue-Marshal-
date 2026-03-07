
import React, { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';

const PushNotificationManager: React.FC = () => {
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated || !user || !Capacitor.isNativePlatform()) {
            return;
        }

        const registerPush = async () => {
            try {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    console.warn('Push notification permission not granted');
                    return;
                }

                await PushNotifications.register();

                // On success, we should be able to receive notifications
                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push registration success, token: ' + token.value);

                    // Save the token to the user document in Firestore
                    if (user.id) {
                        try {
                            await db.collection('users').doc(user.id).update({
                                fcmToken: token.value,
                                lastTokenUpdate: Date.now()
                            });
                        } catch (error) {
                            console.error('Error saving push token to Firestore:', error);
                        }
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Error on push registration: ' + JSON.stringify(error));
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push notification received: ' + JSON.stringify(notification));
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push notification action performed: ' + JSON.stringify(notification));
                });

            } catch (error) {
                console.error('Error in PushNotificationManager:', error);
            }
        };

        registerPush();

        return () => {
            PushNotifications.removeAllListeners();
        };
    }, [isAuthenticated, user?.id]);

    return null; // This component doesn't render anything
};

export default PushNotificationManager;
