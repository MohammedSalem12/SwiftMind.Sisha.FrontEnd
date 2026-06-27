package com.swiftmind.sesha;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
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
 * SessionCountdownPlugin — shows an OS-rendered live countdown timer in the
 * Android notification center for an upcoming session ("الحصة القادمة").
 *
 * The countdown ticks down with ZERO app wakeups: Android's Chronometer renders
 * the timer itself from {@code setWhen(endTimeMillis)} + {@code setChronometerCountDown(true)}.
 * The notification is silent and ongoing (a low-importance channel) so updating it
 * does not buzz the device.
 */
@CapacitorPlugin(name = "SessionCountdown")
public class SessionCountdownPlugin extends Plugin {

    private static final String CHANNEL_ID = "sesha_countdown";
    private static final String CHANNEL_NAME = "العد التنازلي للحصة — Session Countdown";

    @Override
    public void load() {
        createChannel();
    }

    /**
     * start({ sessionId, title, body, endTimeMillis, deepLink? })
     * Shows (or replaces) the ongoing countdown notification for a session.
     */
    @PluginMethod
    public void start(PluginCall call) {
        String sessionId = call.getString("sessionId");
        if (sessionId == null || sessionId.isEmpty()) {
            call.reject("sessionId is required");
            return;
        }

        Long endTimeMillis = call.getLong("endTimeMillis");
        if (endTimeMillis == null || endTimeMillis <= 0) {
            call.reject("endTimeMillis is required");
            return;
        }

        String title = call.getString("title", "الحصة القادمة");
        String body = call.getString("body", "");
        String deepLink = call.getString("deepLink");

        Context context = getContext();
        createChannel();

        // Tap opens the app at a deep-link route. We launch a kai:// VIEW intent so it
        // flows through Capacitor's existing appUrlOpen handler (same path as other deep links).
        String route = (deepLink != null && !deepLink.isEmpty()) ? deepLink : "/student/today-sessions";
        Uri uri = Uri.parse("kai://session?route=" + Uri.encode(route));
        Intent launchIntent = new Intent(Intent.ACTION_VIEW, uri);
        launchIntent.setPackage(context.getPackageName());
        launchIntent.setFlags(
            Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(
            context, notificationId(sessionId), launchIntent, piFlags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(getAppIcon())
            .setContentTitle(title)
            .setContentText(body)
            .setWhen(endTimeMillis)          // the target time the timer counts toward
            .setUsesChronometer(true)        // render a live ticking timer
            .setOngoing(true)                // not swipe-dismissable while live
            .setOnlyAlertOnce(true)          // never re-buzz on update
            .setShowWhen(true)
            .setContentIntent(contentIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setColor(0xFF667EEA)
            .setCategory(NotificationCompat.CATEGORY_EVENT)
            .setPriority(NotificationCompat.PRIORITY_LOW);

        // Count DOWN to setWhen (API 24+); on older devices it counts up (graceful fallback).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            builder.setChronometerCountDown(true);
        }

        try {
            NotificationManagerCompat.from(context).notify(notificationId(sessionId), builder.build());
        } catch (SecurityException e) {
            // POST_NOTIFICATIONS not granted (Android 13+); fail soft.
            call.reject("Notification permission not granted");
            return;
        }

        JSObject ret = new JSObject();
        ret.put("sessionId", sessionId);
        ret.put("notificationId", notificationId(sessionId));
        call.resolve(ret);
    }

    /**
     * stop({ sessionId }) — cancels the countdown notification (e.g. session started or cancelled).
     */
    @PluginMethod
    public void stop(PluginCall call) {
        String sessionId = call.getString("sessionId");
        if (sessionId == null || sessionId.isEmpty()) {
            call.reject("sessionId is required");
            return;
        }
        NotificationManagerCompat.from(getContext()).cancel(notificationId(sessionId));
        call.resolve();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getContext().getSystemService(NotificationManager.class);
            if (manager == null) {
                return;
            }
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW   // silent: no sound/vibration on update
            );
            channel.setDescription("عرض العد التنازلي للحصة القادمة — Live countdown to your next session");
            channel.setShowBadge(false);
            channel.enableVibration(false);
            channel.setSound(null, null);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            manager.createNotificationChannel(channel);
        }
    }

    /** Stable per-session notification id so start() replaces (not stacks) the same session. */
    private int notificationId(String sessionId) {
        // Offset away from FCM ids; keep positive.
        return 0x5E55_0000 | (sessionId.hashCode() & 0x0000_FFFF);
    }

    private int getAppIcon() {
        // Reuse the launcher/notification small icon resource.
        int icon = getContext().getResources().getIdentifier(
            "ic_stat_icon_config_sample", "drawable", getContext().getPackageName());
        if (icon == 0) {
            icon = getContext().getApplicationInfo().icon;
        }
        return icon;
    }
}
