# Project document archives

Only project files, a project ID, title and description go to a private repository owned by GITHUB_STORAGE_OWNER. Users, contacts, financial data, chat attachments, avatars and MongoDB backups stay on the server. Repository names include immutable project IDs; renames update project.json and README.md. Site deletion is a soft archive and never calls GitHub DELETE.

Uploads return after local storage and MongoDB persistence. A separate worker processes durable jobs, recovers expired claims, retries transient failures and respects rate limits. Each newly uploaded file has a unique path and commit. Interrupted retries reuse existing identical content without duplicating commits. Synced status requires a streamed SHA-256 round-trip verification from the GitHub blob API.

Verified copies are evicted after 24 hours without use. Before removal the worker verifies remote path, blob and size, plus the local SHA-256. A cache lease protects simultaneous downloads. Unsynced files and unverifiable copies are retained. Authorized downloads fetch private blobs through the backend, verify size and SHA-256, and recreate a temporary local cache. Tokens and private blob metadata are never sent to browsers.

## Runtime configuration

GITHUB_STORAGE_ENABLED=true
GITHUB_STORAGE_OWNER=ARCHLAB-di
GITHUB_STORAGE_TOKEN_FILE=/etc/archlab/github-token
GITHUB_STORAGE_CACHE_HOURS=24

Keep the token outside the repository, owned by the service account with mode 0400. No credentials belong in project repositories. Rotate tokens by replacing that protected file, then restarting both archlab and archlab-github-storage. Use repository permissions; this application never needs delete_repo or organization administration. A local fake API override is available only in development; production always uses api.github.com.

Run the worker with the same environment, MongoDB and upload directory as the API. Production uses archlab-github-storage.service with autostart and restart-on-failure. Settings shows worker health and archive counts. Existing project files are automatically reconciled into the queue. MongoDB remains the source of authorization and archive bindings; maintain existing database backups. Daily upload backups omit only verified project cache files to avoid retaining extra server copies. Unsynced project documents, chat files, avatars, and other local files keep their existing backup coverage. Existing historical backups retain their normal 14-day expiry.

GitHub is not unlimited object storage. This integration caps project files at 95 MiB; GitHub rejects ordinary files above 100 MiB and recommends repositories below 10 GB. Upload throughput is constrained by content-write/API limits. The worker slows writes, pauses and retries without deleting local copies. Large or sustained document volumes should move to a supported object-storage provider rather than assuming unlimited GitHub capacity.

## Validation

npm run test:storage uses isolated MongoDB on 127.0.0.1:27021 and a local fake GitHub API. It checks immediate uploads, private repositories, data exclusion, durable retries, hash verification, 24-hour cache expiry, remote outages, concurrent cache downloads, access control, renames and repository retention. It does not use the production token or production data.
