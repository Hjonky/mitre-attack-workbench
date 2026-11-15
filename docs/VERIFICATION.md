# Verification notes

Verified locally during the redesign using Node **22.22.1** on Linux. The provided database's original six fields were compared record by record with the source archive: all **697 records** were preserved.

## Automated checks

- `npm run build`: production React build completed successfully.
- `npm test`: **10 tests passed**, using a separate in-memory SQLite database.
- `npm audit --omit=dev`: reported **zero known production dependency vulnerabilities** at the time of verification. This is a point-in-time registry report, not a security guarantee.

The tests cover optional configuration reporting, name/description/identifier search, JSON 404s, individual tactic and platform counts, assistant search context isolation, exact SHA-256 fingerprints, upload requirements and size limits, hash validation, unavailable reputation reports, and malicious/suspicious/no-detection classifications.

VirusTotal responses were simulated in regression tests. No live VirusTotal key was used, and external reputation lookups were not verified against a paid or authenticated account.

## Startup and production serving

- The development launcher started the frontend and API; both returned HTTP 200.
- Sending Ctrl+C to the launcher stopped both child processes and released ports 3001 and 5173.
- The optimized production server returned HTTP 200 for the app root, a direct PowerShell technique URL, and `/api/health`.

## Browser checks

Desktop and 390-pixel mobile layouts were inspected. Screenshots in `docs/images` show the actual application using its bundled dataset.

Verified:

- Technique search combined with Windows and Execution filters: **7 results** for PowerShell.
- CSV download: **7 data rows and 6 columns**, matching that filtered result set.
- Pagination advanced from records 1–10 to records 11–20.
- A query with no matches displayed the empty state and disabled export; reset restored the library.
- PowerShell details displayed behavior text, formatted code, platform/tactic mappings, and related techniques.
- Tactic chart selection displayed the **64 Execution techniques** in its preview section.
- Assistant search returned **47 PowerShell-related techniques**, linked results, and a working `show` follow-up.
- Uploading a harmless generated text file returned the expected SHA-256 hash and an explicit missing-key status.
- Dark theme persisted after reload.
- Mobile navigation opened, selected a page, closed on navigation, and closed with Escape.
- Explorer, analytics, assistant, and analyzer layouts fit the mobile page width. The technique table scrolls within its own region.
- No console errors were recorded in the final browser flow.

## Limits

- The upstream dataset refresh command was not executed, so the original snapshot remains intact. Its exact upstream ATT&CK release is unknown.
- GitHub Actions configuration is included, but hosted Linux/Windows CI runs will happen only after the owner pushes the repository.
- Windows and macOS were not run locally. Use the included Windows CI job to verify that platform.
- No remote deployment, GitHub repository creation, or public publication was performed.
- This remains a local research application. The file analyzer does not execute files, and the assistant does not use a generative AI model.
