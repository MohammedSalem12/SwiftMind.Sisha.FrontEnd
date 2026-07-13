// ============================================================
// DEPRECATED as a separate config — kept only so that existing
// `ng build --configuration vps` commands (and older docs/scripts) keep working.
//
// The VPS *is* production now, so there is exactly ONE production definition:
// environment.prod.ts. This file re-exports it.
//
// History: this file used to hold its own copy of the VPS settings, which had
// silently drifted from environment.prod.ts (it was missing `googleClientId`,
// so Google sign-in was broken in every `--configuration vps` build).
// Do not re-add settings here — edit environment.prod.ts instead.
// ============================================================
export { environment } from './environment.prod';
