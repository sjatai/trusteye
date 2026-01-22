UI Guidelines



Create / Add / New buttons (e.g. “New Audience”, “New Campaign”, “Add Content”, “New Automation”) – if these routes are not yet implemented, they should either (a) open a stub page explaining that the feature is coming soon or (b) be disabled with a tooltip (“Coming soon”). Don’t let them silently do nothing.

Action icons on cards (ellipsis menus, launch buttons, configure connectors) – ensure each opens a real editor/preview.

Preview panel – this pane appears on every page, showing a generic “Start a campaign to see live previews” message
screenshot
. Consider hiding the preview panel on pages where it doesn’t add value (e.g. Settings, Integrations). Alternatively, display meaningful empty states tailored to each section (e.g. “Select an audience to preview messaging” in Audiences).

Integrations → “Connect”/“Configure” buttons – these should open either a working configuration page or a stub with details about the upcoming integration. Grey out buttons that are not yet wired up.

Settings sub‑sections – under Settings there are tabs (Profile, Notifications, Security, Appearance, Data & Privacy, Billing, Team, API & Webhooks). Only “Profile” currently shows fields; clicking other tabs should either render their settings page or be disabled if not ready.

UI/UX suggestions for a more polished feel:

Disabled vs. hidden states: never leave a clickable item with no handler. Either remove it from the UI or render it disabled with a tooltip.

Consistent empty states: lists and previews should show a call‑to‑action (“You don’t have any campaigns yet – click ‘New Campaign’”) instead of blank space.

Loading and error states: add skeleton loaders while fetching data and clear error messages with retry actions if a route fails.

Navigation clarity: highlight the active nav item; hide the generic preview pane on settings/integrations pages; and consider collapsing less‑used sections into a “More” menu if the nav grows.

Accessibility: ensure all icon buttons have aria‑labels and focus states; allow keyboard navigation through lists and filters.