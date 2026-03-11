---
name: game-approve
description: Approve reviewed games and publish to main site with git sync
version: 1.0.0
---

# Game Approval and Publishing

Approve manually reviewed games and publish them to the main EduGameHQ site.

## Usage

```bash
/game-approve [options] [slugs...]
```

**Options:**
- `--list`: List all pending review games
- `--all`: Approve all pending games

**Examples:**
```bash
/game-approve --list
/game-approve tetris-game snake-classic
/game-approve --all
```

## What This Skill Does

1. **Load pending games** from `output/pending-review.json`
2. **Filter selected games** (by slug or all)
3. **Update game status** to `approved` and `published: true`
4. **Add to games.json** - Merge with existing games
5. **Commit to git** with descriptive message
6. **Push to GitHub** - Triggers Vercel auto-deploy

## Output

- Games added to `src/data/games.json`
- Git commit created and pushed
- Approved games removed from `output/pending-review.json`
- Deployment triggered on Vercel

## Notes

- Games go live immediately after approval
- Screenshots must exist in `public/screenshots/`
- Use `--list` first to see what's pending

