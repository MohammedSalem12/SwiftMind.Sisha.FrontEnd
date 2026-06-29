import ActivityKit
import WidgetKit
import SwiftUI

/// Live Activity UI for the next-session countdown.
///
/// Lives in the Widget Extension target. The countdown is rendered by SwiftUI's
/// `Text(timerInterval:)`, so iOS ticks it down with no app involvement.
///
/// Requires `SessionCountdownAttributes.swift` to also be a member of this target.
@available(iOS 16.1, *)
struct SessionCountdownLiveActivity: Widget {
    // KAI brand purple.
    private let brand = Color(red: 0x66 / 255, green: 0x7e / 255, blue: 0xea / 255)

    // Tap opens the app at the sessions page (same deep link as Android).
    private let tapURL = URL(string: "kai://session?route=/student/today-sessions")

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: SessionCountdownAttributes.self) { context in
            // MARK: Lock Screen / banner presentation
            HStack(spacing: 12) {
                Image(systemName: "clock.badge.fill")
                    .font(.title2)
                    .foregroundStyle(brand)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.title)
                        .font(.headline)
                        .lineLimit(1)
                    if !context.state.subtitle.isEmpty {
                        Text(context.state.subtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    }
                }
                Spacer()
                Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                    .font(.title2.monospacedDigit().bold())
                    .foregroundStyle(brand)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 84)
            }
            .padding()
            .widgetURL(tapURL)
            .activityBackgroundTint(Color.black.opacity(0.05))
            .activitySystemActionForegroundColor(brand)

        } dynamicIsland: { context in
            DynamicIsland {
                // MARK: Expanded presentation
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "clock.badge.fill")
                        .foregroundStyle(brand)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                        .font(.title3.monospacedDigit().bold())
                        .foregroundStyle(brand)
                        .frame(maxWidth: 72)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 1) {
                        Text(context.attributes.title)
                            .font(.caption.bold())
                            .lineLimit(1)
                        if !context.state.subtitle.isEmpty {
                            Text(context.state.subtitle)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                }
            } compactLeading: {
                Image(systemName: "clock.fill").foregroundStyle(brand)
            } compactTrailing: {
                Text(timerInterval: Date()...context.state.endDate, countsDown: true)
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(brand)
                    .frame(maxWidth: 44)
            } minimal: {
                Image(systemName: "clock.fill").foregroundStyle(brand)
            }
            .widgetURL(tapURL)
            .keylineTint(brand)
        }
    }
}
