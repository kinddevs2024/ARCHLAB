# ARCHLAB operational analytics

`/analytics` reads the authenticated `/api/analytics` endpoint. It uses live MongoDB aggregates, not downloaded database snapshots or sample production records. No business/user database data is committed to source or exported to the file archive.

The period selector supports 7/30/90 calendar days in Asia/Tashkent, ending now, with the current day explicitly incomplete. Periods affect the activity timeline/journal and new-project count. Portfolio, task progress and employee workload are current-state measures, independently of period. The selected project scopes every measure. All lists are paginated; the project picker searches the existing paginated API.

- Portfolio excludes soft-deleted projects, retaining the four explicit status categories.
- Task totals exclude soft-deleted and status-archived tasks, matching resource access: admins see all, managers see their visible projects and their own projectless tasks, ordinary users see only their assigned eligible tasks.
- Completion is done/eligible task count, rounded to an integer percent. An empty denominator returns null and displays no percentage; project status is independent of task completion.
- Overdue means an open task whose due date precedes today's start in Asia/Tashkent. Today's deadline does not count as overdue.
- Employee project assignments deduplicate assignedTo/helper/master per project. Unassigned tasks remain in totals and are identified separately; employee counts are not added to distinct project totals.
- Activity counts recorded create/update/upload/archive/restore/avatar/deactivate events, excluding login/logout/password/download events. Download logging includes automatic authenticated avatar fetches, so it cannot establish a user operation. Audit access remains Owner-only. Other roles receive no audit records or counts and instead see their visible new-project timeline. There is no inferred completion history, work-hours estimate or productivity score.
- Project-filtered activity joins existing audit entity IDs to their underlying resources. The response exposes only a safe title, action, actor display identity, date and authorized navigation; it omits audit IP/details and credentials.

The page uses existing Material Tailwind components, theme tokens, Anime.js entrance motion and accessible SVG charts. Visible pages refresh each minute; refresh requests are cancelled on unmount/filter changes. Refresh is an in-page behavior and does not create a schedule or background automation.

`npm run test:analytics` verifies independent known fixture totals, zero denominators, overdue date boundaries, 7/30/90 periods, project joins and pagination, anonymous denial, all four roles, actual picker/reset/period interactions, chart marks, error recovery and both themes at 360/390/768/1440 pixels. Fixtures are synthetic and confined to the isolated test database at 127.0.0.1:27021. `npm run test:integration` also covers the unchanged application flows.
