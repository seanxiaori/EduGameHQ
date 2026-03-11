---
name: game-search-review
description: Search for educational games and publish to review subdomain for manual approval
version: 1.0.0
---

# Game Search and Review

Search for educational HTML5 games from GitHub and publish them to the review subdomain (games.edugamehq.com) for manual testing and approval.

## Usage

```bash
/game-search-review [type] [count]
```

**Arguments:**
- `type` (optional): Game type to search (tetris, puzzle, snake, etc.). Default: all types
- `count` (optional): Number of games to find. Default: 20

**Examples:**
```bash
/game-search-review tetris 5
/game-search-review puzzle 10
/game-search-review
```

## What This Skill Does

1. **Search GitHub** for HTML5 games with 50+ stars
2. **Check duplicates** against existing games in games.json
3. **Verify URLs** - Check accessibility and iframe compatibility
4. **Verify game content** - Ensure it's actually a playable game (canvas elements)
5. **Capture screenshots** - Take gameplay screenshots
6. **Generate metadata** - Create complete game data
7. **Save for review** - Output to `output/pending-review.json` with status `pending_review`

## Output

- **Review list**: `output/pending-review.json`
- **Screenshots**: `public/screenshots/[slug].png`
- **Status**: All games marked as `pending_review`
- **Review URL**: Each game gets a review URL for testing

## Next Steps

After running this skill:
1. Manually test each game at the review URL
2. Use `/game-approve [slug]` to approve good games
3. Approved games will be published to main site

