# marketo-middleware

Starter code for the Marketo integration in Optimizely CMP. When the
integration is enabled, a copy of this code is added to your organization's
repository and runs as a hosted app.

## Logging

A hosted app's output appears in CMP as the app's *Application Logs*, which is
the main way to see how it handled a request. Logging is designed for that
view:

- Each entry is a single plain-text line.
- Every line written while handling a webhook carries a request id. If a
  webhook fails, its error response includes the same id, so the related lines
  are easy to find.
- Each call to Marketo or CMP logs one line with the operation, HTTP status,
  duration and, for Marketo, its `requestId` and any errors.

### Log level

The amount of detail is set by `LOG_LEVEL`. `manifest.json` declares it as an
app parameter, so it appears as a *Log Level* field in the app's settings in
CMP and can be changed without editing the code.

| `LOG_LEVEL` | What is logged |
|---|---|
| `info` (default) | One line per webhook step and per Marketo or CMP call |
| `debug` | Everything at `info`, plus each incoming webhook payload in full and the Marketo and CMP request and response bodies (each truncated to 2000 characters). These include your content, such as field values and email HTML. |

Any other value, including other level names such as `warn`, is treated as
`info`.

### Getting detailed logs

1. In the app's settings in CMP, set *Log Level* to `debug` and save. Saving
   redeploys the app with the new setting.
2. When the app has restarted, a `logger initialised` line in the Application
   Logs shows `"logLevel":"debug"`.
3. Repeat the action you are investigating, for example requesting a preview.
4. Review the Application Logs soon afterwards, while the entries are recent.
5. Set *Log Level* back to `info` when you are done, because `debug` logs
   include your content.

Apps set up from an earlier version of this code may not show the *Log Level*
field.

### Credentials

The logs are designed to exclude credentials: token request bodies, and the
responses that carry the tokens, are not logged; `Authorization` and
`callback-secret` headers are redacted; and credential query parameters in URLs
are replaced with `REDACTED`.
