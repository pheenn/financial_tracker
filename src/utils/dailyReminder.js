import { LocalNotifications } from '@capacitor/local-notifications';

const DAILY_REMINDER_ID = 8001;

export async function setupDailyReminder() {
  try {
    // Check notification permission
    let permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }

    if (permission.display !== 'granted') {
      console.log('Notification permission was not granted.');
      return;
    }

    // Prevent duplicate scheduled reminders
    const pending = await LocalNotifications.getPending();

    const alreadyScheduled = pending.notifications.some(
      notification => notification.id === DAILY_REMINDER_ID
    );

    if (alreadyScheduled) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_REMINDER_ID,
          title: 'Financial Tracker',
          body: 'Good morning! Open your Financial Tracker and check your finances.',
          schedule: {
            on: {
              hour: 8,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          autoCancel: true,
        },
      ],
    });

    console.log('Daily 8:00 AM reminder scheduled.');
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
  }
}
