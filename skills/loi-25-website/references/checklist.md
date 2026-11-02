# Law 25 website audit checklist

Source: the Act respecting the protection of personal information in the private sector (P-39.1; French: Loi sur la protection des renseignements personnels dans le secteur privé (RLRQ, c. P-39.1)), as read in its version current to 10 June 2026. Section numbers are the Act's. This is not legal advice.

For each item, record `pass`, `fix` or `n.a.`, plus the page or file that proves it.

| # | Item | Section | Where to look | Pass when |
|---|---|---|---|---|
| 1 | Person in charge named | s. 3.1 | privacy policy page, footer | Title and contact information of the person in charge are published on the site |
| 2 | Privacy policy in plain language | s. 8.2 | policy page, footer link | The policy describes what this site collects, in clear and simple language, and says how changes are announced |
| 3 | Notice at collection | s. 8, s. 8.3 | every form, newsletter field, booking widget | Each collection point says what the information is for, how it is collected, the rights of access, correction and withdrawal, whether it may leave Québec, and links to the policy |
| 4 | Identification, location, profiling | s. 8.1 | layout, tag manager, ad pixels, embeds | No such technology is active before the visitor has chosen it, and the visitor is told how to activate it |
| 5 | Tools hosted outside Québec | s. 17, s. 3.3 | list of third-party services | A list exists with where each service keeps its data; an impact assessment and a written agreement exist for those that keep it outside Québec |
| 6 | Incident register | s. 3.5, s. 3.8 | internal documents | A register exists (even empty) and the notification path to the Commission is known |
| 7 | Portability | s. 27 | inbox, CRM, form backend | One person's information can be found and exported in a structured, commonly used format |

Mark `n.a.` only with a reason (for example item 4 when the site loads no third-party script at all).

## Finding the evidence in a codebase

- Third-party services: grep for `<script`, `fetch(` to external hosts, `iframe`, form `action=`, analytics and tag-manager snippets, newsletter and booking embeds.
- Collection points: grep for `<form`, `type="email"`, `mailto:` buttons, server actions and API routes that read a body.
- Profiling: ad pixels, session replay, fingerprinting libraries, cross-site analytics. Plain first-party analytics that follow nobody across sites raise a different question.
- Policy page: find the route, then check the person in charge line and the date.
