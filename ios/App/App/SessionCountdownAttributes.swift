import Foundation

#if canImport(ActivityKit)
import ActivityKit

/// Shared Live Activity model for the "next session" countdown.
///
/// IMPORTANT: This file must be a member of BOTH the app target (App) and the
/// Widget Extension target (SessionCountdownWidgetExtension) so the plugin and
/// the widget UI agree on the same type. See IOS_LIVE_ACTIVITY_SETUP.md.
@available(iOS 16.1, *)
struct SessionCountdownAttributes: ActivityAttributes {
    /// Dynamic part — what changes over the life of the activity.
    public struct ContentState: Codable, Hashable {
        /// The session start time. The widget renders a self-ticking countdown to this.
        var endDate: Date
        /// Secondary line, e.g. group name or location.
        var subtitle: String
    }

    /// Static part — fixed for the life of the activity.
    var title: String
    var sessionId: String
}
#endif
