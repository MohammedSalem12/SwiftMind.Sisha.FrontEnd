# iOS Live Activity — Next Session Countdown (Setup Guide)

This adds an iOS **Live Activity** (Lock Screen + Dynamic Island) that shows a
self-ticking countdown to the next session — the iOS counterpart of the Android
Chronometer notification. Same JS API (`SessionCountdown.start/stop`), driven by
`SessionCountdownService`.

> ⚠️ **Must be done on macOS in Xcode.** Creating a Widget Extension target edits
> the `.xcodeproj`, which cannot be generated reliably on Windows. The Swift
> source files are already written; the steps below wire them into a target.

## Files already in the repo

| File | Belongs to target |
|------|-------------------|
| `App/App/SessionCountdownPlugin.swift` | **App** (already in target) |
| `App/App/SessionCountdownAttributes.swift` | **App _and_ Widget** (shared) |
| `App/SessionCountdownWidget/SessionCountdownLiveActivity.swift` | **Widget** |
| `App/SessionCountdownWidget/SessionCountdownWidgetBundle.swift` | **Widget** |
| `App/App/Info.plist` → `NSSupportsLiveActivities = YES` | already added |

## Steps (Xcode)

1. **Open the workspace**
   - `cd angular && npx cap open ios` (or open `ios/App/App.xcworkspace`).

2. **Add the Widget Extension target**
   - File ▸ New ▸ Target… ▸ **Widget Extension**.
   - Product Name: **`SessionCountdownWidget`**.
   - **Uncheck** "Include Configuration App Intent". **Check** "Include Live Activity".
   - Embed in **App**. Finish. (When prompted to activate the new scheme, Cancel — keep the App scheme.)
   - Xcode generates a starter widget file in the new target. **Delete** the auto-generated `.swift` files in `SessionCountdownWidget/` (we provide our own).

3. **Add our Widget source files to the Widget target**
   - In Finder the files already exist under `ios/App/SessionCountdownWidget/`.
   - In Xcode, right-click the `SessionCountdownWidget` group ▸ **Add Files to "App"…** ▸ select
     `SessionCountdownLiveActivity.swift` and `SessionCountdownWidgetBundle.swift`.
   - In the dialog, **Target Membership = SessionCountdownWidgetExtension only**.

4. **Share the attributes type with both targets**
   - Select `App/App/SessionCountdownAttributes.swift` in the Project navigator.
   - In the **File Inspector ▸ Target Membership**, tick **both** `App` and
     `SessionCountdownWidgetExtension`.
   - (Do **not** add `SessionCountdownPlugin.swift` to the widget target — app only.)

5. **Deployment target**
   - Set the Widget Extension's **iOS Deployment Target to 16.1** (minimum for Live Activities).
   - The App target can stay at its current minimum; the plugin guards with
     `if #available(iOS 16.1, *)` so older devices simply no-op.

6. **Confirm the app's `Info.plist`** already contains:
   ```xml
   <key>NSSupportsLiveActivities</key>
   <true/>
   ```
   (Already added by this change. The Widget Extension does **not** need this key.)

7. **Build & run on a real device** (Live Activities don't show in older simulators;
   iOS 16.2+ simulators work). Settings ▸ Face ID / Live Activities must be allowed.

## How it runs

- `SessionCountdownService` (Angular) calls `SessionCountdown.start({ sessionId, title, body, endTimeMillis, deepLink })`.
- `SessionCountdownPlugin.swift` calls `Activity.request(...)` with `endDate = endTimeMillis`.
- `SessionCountdownLiveActivity.swift` renders `Text(timerInterval: now...endDate, countsDown: true)` — iOS ticks it.
- `stop({ sessionId })` ends the matching activity. Logout / rollover handled by the service.
- Tapping the activity opens `kai://session?route=/student/today-sessions`, handled by the existing `appUrlOpen` listener in `app.component.ts`.

## Optional later: push-updated / remote-start

This v1 is **local only** (the app starts the activity when it's foregrounded and a
session is near). To start/update activities while the app is **not** running you'd add
**ActivityKit push** (APNs `liveactivity` push type + the activity's push token sent to the
backend). Not required for the local countdown; documented for future scope.

## Troubleshooting

- *"Cannot find type SessionCountdownAttributes in scope"* in the widget → step 4 (shared target membership) wasn't applied.
- *Activity never appears* → device Settings ▸ KAI ▸ **Live Activities** disabled, or deployment target < 16.1.
- *Two activities stack* → ensured by `endActivities(for:)` before `request`; verify `sessionId` is stable (it's the group schedule id).
