# Website

Public website for Talos Operations LLC's Fee Simple product.

Static HTML/CSS/JS. No build step or package installation. Deployed by Netlify on every push to `main`.

## Site direction

Keep the main site small: Home, Coverage (details TBD), and a link to the future demo.
The home page and its hero are the priority. The replacement demo is being built
separately and will be integrated later; the old local demo was removed.

`learn/` and `for/` are existing content sections, pending a separate cleanup decision.
Do not treat the intended navigation as approval to delete those sections.
Privacy and Terms are footer pages.

Any future public demo data must be entirely fictitious; never publish real
parcel, owner, or recorded-instrument data as sample data.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
