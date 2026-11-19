/**
 * Categories for the /icons page: group name → icon names, in display order.
 * Covers icons.ts (CORE) and icons-ui.ts. The world set brings its own WORLD_GROUPS.
 * Anything not listed in any group still shows up, under "More".
 */
export const ICON_GROUPS: Record<string, string[]> = {
  Arrows: [
    "arrow-right", "arrow-left", "arrow-up", "arrow-down", "arrow-up-right", "arrow-up-left", "arrow-down-right", "arrow-down-left",
    "arrow-left-right", "arrow-up-down", "arrow-circle-right", "arrow-circle-left", "arrow-circle-up", "arrow-circle-down",
    "chevron-right", "chevron-left", "chevron-up", "chevron-down", "chevrons-right", "chevrons-left", "chevrons-up", "chevrons-down",
    "chevrons-up-down", "corner-down-left", "corner-up-right", "move", "trending-up", "trending-down",
  ],
  Interface: [
    "menu", "plus", "minus", "x", "check", "search", "zoom-in", "zoom-out", "command", "external", "home",
    "grid", "grid-3", "list", "kanban", "sidebar", "sidebar-right", "sidebar-collapse", "sidebar-expand", "panel-top", "panel-bottom",
    "layout", "columns", "rows", "window", "maximize", "minimize", "fullscreen", "fullscreen-exit", "scan", "focus",
    "more-horizontal", "more-vertical", "more-circle", "grip-vertical", "grip-horizontal", "sort-up", "sort-down",
    "settings", "sliders", "pointer", "qr-code", "square", "circle",
  ],
  Actions: [
    "edit", "pen-line", "edit-square", "eraser", "trash", "backspace", "archive", "copy", "scissors", "crop",
    "clipboard", "clipboard-check", "clipboard-text", "undo", "redo", "refresh", "rotate-ccw", "sync", "history",
    "download", "upload", "import", "export", "cloud-upload", "cloud-download", "cloud-off", "share", "share-up", "save",
    "pin", "pin-off", "bookmark", "bookmark-plus", "bookmark-check", "flag", "flag-triangle", "tag", "tags",
    "filter", "funnel", "funnel-x", "plus-circle", "minus-circle", "plus-square", "check-square", "link", "paperclip", "wand",
  ],
  Text: [
    "type", "bold", "italic", "underline", "strikethrough", "heading", "heading-1", "heading-2", "pilcrow",
    "align-left", "align-center", "align-right", "align-justify", "indent", "outdent", "list-ordered", "list-checks",
    "quote", "link-off", "table", "code", "code-square", "terminal", "text-cursor", "text-wrap", "hash",
  ],
  Files: [
    "file", "file-empty", "file-plus", "file-minus", "file-check", "file-x", "file-down", "file-up", "file-search",
    "file-image", "file-video", "file-audio", "file-zip", "file-code", "file-pdf", "file-spreadsheet", "files",
    "folder", "folder-open", "folder-plus", "folder-minus", "folder-check", "book", "box", "layers", "database",
  ],
  Communication: [
    "mail", "mail-open", "mail-plus", "mail-check", "inbox", "inbox-in", "send", "send-horizontal", "reply", "reply-all", "forward",
    "message", "message-dots", "chat", "messages", "at-sign", "phone", "phone-call", "phone-incoming", "phone-outgoing", "phone-off",
    "voicemail", "megaphone", "rss", "bell", "bell-ring", "bell-off",
  ],
  Media: [
    "play", "pause", "stop", "play-circle", "pause-circle", "stop-circle", "record", "skip-back", "skip-forward", "rewind", "fast-forward",
    "repeat", "repeat-one", "shuffle", "volume", "volume-low", "volume-x", "mic", "mic-off", "camera", "camera-off", "video", "video-off",
    "image", "film", "music", "list-music", "audio-lines", "disc", "headphones", "cast", "airplay", "captions", "pip", "wave",
  ],
  Devices: [
    "monitor", "laptop", "tablet", "smartphone", "watch", "tv", "keyboard", "mouse", "printer", "speaker", "webcam", "gamepad",
    "server", "hard-drive", "cpu", "router", "battery", "battery-medium", "battery-low", "battery-empty", "battery-charging",
    "wifi", "wifi-medium", "wifi-low", "wifi-off", "signal-bars", "bluetooth", "plug", "power",
  ],
  "Users & security": [
    "user", "users", "user-plus", "user-minus", "user-check", "user-x", "user-circle", "id-card", "smile",
    "shield", "shield-empty", "shield-x", "shield-alert", "shield-lock", "shield-off", "lock", "lock-keyhole", "unlock",
    "key", "fingerprint", "face-id", "password", "eye", "eye-off", "eye-closed", "safe", "log-in", "log-out",
  ],
  Status: [
    "info", "help", "alert", "alert-circle", "alert-octagon", "check-circle", "x-circle", "check-double", "ban",
    "loader", "spinner", "toggle-left", "toggle-right", "circle-dot", "activity", "hourglass", "timer", "clock", "calendar",
    "thumbs-up", "thumbs-down", "life-buoy",
  ],
  "Business & data": [
    "wallet", "card", "cart", "bag", "receipt", "gift", "briefcase", "chart", "chart-bar", "pie-chart", "git-branch", "trophy", "award", "target",
  ],
  Objects: [
    "star", "heart", "sparkle", "bolt", "sun", "moon", "cloud", "globe", "map", "map-pin", "compass", "navigation", "truck",
    "rocket", "coffee", "umbrella", "leaf", "droplet", "flame", "anchor",
  ],
};
