# ARCH LAB Workroom

Office workspace based on the 12 frames in ARCH LAB WOORKROOM Figma: login, projects, folders/sketches, contracts/expenses, letters/orders, chat, project/employee/task forms. Tasks, files, dashboard, notifications and personal/company settings follow the shared design system. Mobile navigation is responsive.

## Runtime

Node.js 24, MongoDB 7+, `npm ci`. Copy `.env.example` to a protected environment file. `ENV_FILE` can point to that file. `npm run dev` starts the API and Vite. `npm run build` produces `dist/client` and the Sites Worker in `dist/server`. `npm start` runs the API; Nginx serves `dist/client` and proxies `/api/`.

Public registration is disabled. Bootstrap an owner with `OWNER_EMAIL`, `OWNER_PASSWORD` (12+ characters) and `npm run seed:owner`, passing secrets through the environment. Credentials are never committed. Authentication uses HttpOnly cookies: ordinary session 8 hours, remembered session 30 days. Logout revokes all sessions; changing a password preserves the current browser cookie and revokes old tokens.

## Access and data

Owner has full access. Admin manages projects, staff and settings, but cannot modify Owner accounts. Manager sees assigned projects and manages their documents/tasks; assignment changes and creating projects require Admin. User sees assigned projects, completes own tasks, uploads authorized files and participates in own chats. Contracts and expenses require Manager. Position is separate from role. Helper/master are employee references. Existing user IDs, passwords and roles remain unchanged.

Archiving sets deletedAt; restore keeps original IDs, metadata and stored files. No permanent UI delete. Money values are nonnegative; amount, advance and paid totals are independent business fields, not inferred accounting rules. Exports are XLSX generated from actual records. Attachments support PDF/Office/CAD/archive/image extensions, capped at 100 MB; avatars are decoded/reencoded WebP, capped at 5 MB/20 million pixels. Archives/CAD are retained as downloads without execution or automatic extraction.

## Chat/calls

Socket.IO authenticated polling provides messages, read state and signaling through the Sites proxy. Chats require explicit members. Calls are one-to-one audio/video between members; group chats choose one peer. Browser microphone/camera permission is required. Configure TURN_SECRET and TURN_URLS for authenticated coturn relay credentials valid one hour. Recording and screen sharing are outside the Figma scope. Automated tests use synthetic media devices, two separate sessions and an actual forced TURN relay when configured; physical devices/networks still require a user acceptance check.

## Verification

`npm run lint`, `npm run build`, `npm audit`. For integration, run a separate MongoDB on localhost:27021 then `npx playwright install chromium` and `npm run test:integration`. Never point tests at production. Tests cover PATCH preservation, authorization/search/files, folder hierarchy, archiving/restore, cursor history, document/expense creation, XLSX, image validation, two-user realtime chat, media calls, mobile overflow and themes. CI uses an isolated Mongo service. Results/screenshots go to ignored test-artifacts.

## Deployment and rollback

API, Mongo and TURN are isolated systemd services on the server. Mongo and API bind loopback. Sites publishes static assets plus the Worker which proxies API requests to the TLS origin. Production env and uploads stay outside the release tree. Releases are versioned under /srv/apps/archlab/releases and current is switched atomically after checks. Backups include Mongo archive, uploads, source and a Git bundle; restore was tested against the isolated Mongo instance. Daily protected local backups retain 14 copies. They are on the same server, so an off-server copy is a separate operational requirement.

To roll back, select the previous release symlink and restart archlab; deploy the matching prior Sites version. Additive schema changes and soft deletion do not require a destructive migration. Restore a database backup only when specifically needed, preserving newer data.

Sources: [Figma](https://www.figma.com/design/972IBZyEAQ50diYK5pZBCM/ARCH-LAB-WOORKROOM?node-id=116-10994), [Socket.IO](https://socket.io/docs/v4/client-options/), [Tailwind migration](https://tailwindcss.com/docs/upgrade-guide), [coturn configuration](https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf).
