const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Removes the `aps-environment` (Apple Push Notifications) entitlement that
 * Expo prebuild adds by default when `expo-notifications` is installed.
 *
 * This app only uses LOCAL notifications (reading-plan reminders scheduled via
 * Notifications.scheduleNotificationAsync). It does NOT register for or receive
 * remote push (no getExpoPushTokenAsync / registerForPushNotifications calls),
 * so the remote-push entitlement is unnecessary and its presence forces the
 * provisioning profile to include the Push Notifications capability — which it
 * doesn't, causing the iOS build to fail.
 */
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
