import WidgetKit
import SwiftUI

/// Entry point for the Widget Extension. Exposes the Live Activity.
/// If you later add Home Screen widgets, list them here too.
@main
struct SessionCountdownWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            SessionCountdownLiveActivity()
        }
    }
}
