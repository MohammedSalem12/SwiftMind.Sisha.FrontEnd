import Foundation
import Capacitor

#if canImport(ActivityKit)
import ActivityKit
#endif

/// iOS implementation of the SessionCountdown plugin.
///
/// Mirrors the next upcoming session as a **Live Activity** (Lock Screen +
/// Dynamic Island) showing a self-ticking countdown timer. The widget renders
/// the timer itself via `Text(timerInterval:)`, so the app does not tick it.
///
/// Auto-registered by Capacitor (conforms to CAPBridgedPlugin); the JS side
/// calls `registerPlugin('SessionCountdown')`, matched by `jsName` below.
@objc(SessionCountdownPlugin)
public class SessionCountdownPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SessionCountdownPlugin"
    public let jsName = "SessionCountdown"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "ensurePermission", returnType: CAPPluginReturnPromise)
    ]

    /// Live Activities don't use the notifications permission; they have their own
    /// system enablement (Settings ▸ KAI ▸ Live Activities). Report that, no prompt.
    @objc func ensurePermission(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            call.resolve(["granted": ActivityAuthorizationInfo().areActivitiesEnabled])
            return
        }
        #endif
        call.resolve(["granted": false])
    }

    @objc func start(_ call: CAPPluginCall) {
        guard let sessionId = call.getString("sessionId"), !sessionId.isEmpty else {
            call.reject("sessionId is required")
            return
        }
        guard let endTimeMillis = call.getDouble("endTimeMillis"), endTimeMillis > 0 else {
            call.reject("endTimeMillis is required")
            return
        }
        let title = call.getString("title") ?? "الحصة القادمة"
        let subtitle = call.getString("body") ?? ""
        let endDate = Date(timeIntervalSince1970: endTimeMillis / 1000.0)

        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.reject("Live Activities are not enabled")
                return
            }
            Task {
                do {
                    // Replace any existing activity for this session first.
                    await endActivities(for: sessionId)

                    let attributes = SessionCountdownAttributes(title: title, sessionId: sessionId)
                    let state = SessionCountdownAttributes.ContentState(endDate: endDate, subtitle: subtitle)
                    let content = ActivityContent(state: state, staleDate: endDate)
                    _ = try Activity.request(attributes: attributes, content: content, pushType: nil)
                    call.resolve(["sessionId": sessionId])
                } catch {
                    call.reject("Failed to start Live Activity: \(error.localizedDescription)")
                }
            }
        } else {
            call.reject("Live Activities require iOS 16.1+")
        }
        #else
        call.reject("ActivityKit not available")
        #endif
    }

    @objc func stop(_ call: CAPPluginCall) {
        guard let sessionId = call.getString("sessionId"), !sessionId.isEmpty else {
            call.reject("sessionId is required")
            return
        }
        #if canImport(ActivityKit)
        if #available(iOS 16.1, *) {
            Task {
                await endActivities(for: sessionId)
                call.resolve()
            }
        } else {
            call.resolve()
        }
        #else
        call.resolve()
        #endif
    }

    #if canImport(ActivityKit)
    @available(iOS 16.1, *)
    private func endActivities(for sessionId: String) async {
        for activity in Activity<SessionCountdownAttributes>.activities
        where activity.attributes.sessionId == sessionId {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
    #endif
}
