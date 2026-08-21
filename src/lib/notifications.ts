import { Capacitor } from "@capacitor/core";
import { LocalNotifications, Schedule } from "@capacitor/local-notifications";

let permissionGranted = false;
let channelCreated = false;

async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform() || channelCreated) return;
  try {
    // @ts-ignore - createChannel is available on Android in v6
    const channels = LocalNotifications.createChannel
      ? await LocalNotifications.createChannel({
          id: "naseem-community",
          name: "ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ù…Ø¬ØªÙ…Ø¹",
          description: "Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø®ØªÙ…Ø§Øª ÙˆØ§Ù„Ø£Ø¯Ø¹ÙŠØ© Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠØ©",
          importance: 5,
          vibration: true,
          sound: "notif_sound",
        })
      : null;
    channelCreated = true;
  } catch (e) {
    console.error("channel creation error", e);
  }
}

export async function initLocalNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const perm = await LocalNotifications.requestPermissions();
    permissionGranted = perm.display === "granted";
  } catch (e) {
    console.error("notification permission error", e);
  }
}

export async function showSystemNotification(
  title: string,
  body: string
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!permissionGranted) {
    try {
      const perm = await LocalNotifications.requestPermissions();
      permissionGranted = perm.display === "granted";
    } catch (e) {
      return;
    }
  }
  if (!permissionGranted) return;

  await ensureChannel();

  const schedule: Schedule = {
    at: new Date(Date.now() + 300),
    allowWhileIdle: true,
  };

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() / 1000),
          title,
          body,
          schedule,
          channelId: "naseem-community",
          sound: "notif_sound",
          smallIcon: "ic_stat_icon",
        },
      ],
    });
  } catch (e) {
    console.error("schedule notification error", e);
  }
}