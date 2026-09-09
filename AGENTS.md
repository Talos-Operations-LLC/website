# Website

Public website for Talos Operations LLC's deed tool, plus the product demo at `/demo`.

Static HTML/CSS/JS. No build step, no dependencies. Deployed by Netlify on every push to `main`.

## Demo data

`demo/data/` is entirely fictitious sample data: invented streets, owners, parcel
numbers, book/page references and deed text. Nothing in it comes from a real parcel,
person or recorded instrument, and it must stay that way. The demo is a public page.

The set is generated, not hand-edited. `demo/data/index.json` is the whole stand-in
server's data: one entry per run under `runs`, `order` for the canned history, and
`try` for the addresses the Run page will actually execute.

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
