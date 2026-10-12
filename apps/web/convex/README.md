# Convex configuration

AniList access tokens are encrypted before new account links are stored in
`anilistAccounts`. Configure the Convex deployment with
`ANILIST_TOKEN_ENCRYPTION_KEY` (a random secret of at least 32 characters)
before enabling AniList linking. Keep this value in the deployment's secret
environment, never in the client bundle or source control. Rotating it requires
an explicit token migration/re-link because existing encrypted rows cannot be
decrypted with the old key. If it is missing, linking fails with a setup error
after token verification and the token is not stored or returned by the app.

The implicit OAuth callback carries a per-session OAuth state value. The profile
client only consumes an access-token hash when that state matches the value it
created, which prevents unsolicited callbacks from linking an account in the
active browser session. AniList does not use a server callback here, so this is
intentionally client-side state validation rather than PKCE. The backend keeps
the existing Clerk `subject` key for the pinned issuer above and does not return
the access token to the client.

The issuer-qualified `tokenIdentifier` migration is deferred. It requires an
explicit, separately reviewed migration that reads the pinned issuer and
rewrites every affected table; no implicit fallback or live-data mutation is
performed in this change.
