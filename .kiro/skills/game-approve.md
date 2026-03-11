---
name: game-approve
description: Approve reviewed games and publish to main site
version: 1.0.0
author: EduGameHQ
tags: [games, approve, publish, automation]
---

# Game Approval and Publishing Skill

## Purpose
Approve reviewed games and publish them to the main EduGameHQ site with git sync.

## Workflow
1. Load pending review games from `output/pending-review.json`
2. Show list of games with their review status
3. User selects games to approve
4. Add approved games to `src/data/games.json`
5. Update game status to `approved` and `published: true`
6. Commit and push to GitHub
7. Remove approved games from pending review list

## Usage
```
/game-approve [slug1] [slug2] ...
```

Examples:
- `/game-approve tetris-game snake-classic` - Approve specific games
- `/game-approve --all` - Approve all pending games
- `/game-approve --list` - List all pending review games

## Implementation

When this skill is invoked:

1. **List mode** (`--list`)
   - Read `output/pending-review.json`
   - Display table with: slug, title, category, reviewUrl
   - Show total pending count

2. **Approve mode** (with slugs or `--all`)
   - Load pending games from `output/pending-review.json`
   - Filter selected games (or all if `--all`)
   - For each game:
     - Update status: `approved`, `published: true`, `verified: false`
     - Add to `src/data/games.json`
   - Commit changes with message: "feat: approve and publish N games"
   - Push to GitHub
   - Remove approved games from `output/pending-review.json`

3. **Report results**
   - Games approved and published
   - Git commit hash
   - Deployment status (Vercel auto-deploy)

## Notes
- Games are immediately live after approval
- Screenshots must exist in `public/screenshots/`
- Approved games still need SEO verification (`verified: false`)