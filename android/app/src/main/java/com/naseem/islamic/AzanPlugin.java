package com.naseem.islamic;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Native plugin that shows a full-screen azan notification (like an alarm) so it
 * appears above other apps and on the lock screen, playing the selected azan sound.
 */
@CapacitorPlugin(name = "Azan")
public class AzanPlugin extends Plugin {

    private static final String CHANNEL_ID = "azan-fullscreen";
    private static final int NOTIFICATION_ID = 200001;

    @PluginMethod
    public void showAzan(PluginCall call) {
        String title = call.getString("title", "حان وقت الصلاة");
        String body = call.getString("body", "");
        String sound = call.getString("sound", "azan_1");

        Context context = getContext();
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        ensureChannel(nm, sound);

        // Full-screen intent: launches the app's main activity over the lock screen.
        Intent fullScreenIntent = new Intent(context, MainActivity.class);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                context, 0, fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/raw/" + sound);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setSound(soundUri)
                .setAutoCancel(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setFullScreenIntent(fullScreenPendingIntent, true);
        }

        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build());
            call.resolve();
        } catch (SecurityException e) {
            call.reject("Notification permission not granted");
        }
    }

    @PluginMethod
    public void cancelAzan(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(NOTIFICATION_ID);
        call.resolve();
    }

    private void ensureChannel(NotificationManager nm, String sound) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = nm.getNotificationChannel(CHANNEL_ID);
        if (channel == null) {
            Uri soundUri = Uri.parse("android.resource://" + getContext().getPackageName() + "/raw/" + sound);
            NotificationChannel c = new NotificationChannel(CHANNEL_ID, "منبه الأذان", NotificationManager.IMPORTANCE_HIGH);
            c.setDescription("رنين الأذان في أوقات الصلاة");
            c.enableVibration(true);
            c.setSound(soundUri, new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            c.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
    }
}
