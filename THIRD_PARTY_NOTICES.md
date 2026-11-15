# Third-party notices

## MITRE ATT&CK data

The bundled `backend/mitre.db` contains the technique records supplied with the original project. The original seed script obtained data from the public MITRE CTI repository. The archive did not record an exact upstream ATT&CK version or retrieval timestamp. The redesign preserves its 697 technique records, descriptions, platform values, and tactic values; it adds optional fields for official technique IDs and URLs.

Source: https://github.com/mitre/cti

MITRE's license and copyright notice are reproduced in [docs/MITRE-LICENSE.txt](docs/MITRE-LICENSE.txt), downloaded from the upstream repository. They apply to MITRE content, independently of any license chosen for the surrounding application.

MITRE ATT&CK® is a registered trademark of The MITRE Corporation. This is an independent project and does not imply MITRE affiliation or endorsement.

## Application dependencies

React, React Router, Vite, Express, better-sqlite3, Multer, dotenv, Lucide, react-markdown, and Inter retain their own licenses. Installations include the applicable notices in their respective npm packages. Inter is self-hosted through the Fontsource package; no external font request is needed at runtime.

A project-wide application license is left for the repository owner to choose. The original backend package declared ISC, but the supplied archive contained no repository-wide code license file.
