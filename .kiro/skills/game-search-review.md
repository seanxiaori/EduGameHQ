---
name: game-search-review
description: Search for games and publish to review subdomain
version: 1.0.0
author: EduGameHQ
tags: [games, search, review, automation]
---

# Game Search and Review Skill

## Purpose
Search for educational games from GitHub and publish them to games.edugamehq.com subdomain for review.

## Workflow
1. Search GitHub for HTML5 educational games (50+ stars)
2. Check for duplicates against existing games
3. Verify URL accessibility and iframe compatibility
4. Verify game content (canvas elements, playable)
5. Capture game screenshots
6. Generate game metadata
7. Publish to review subdomain with status: "pending_review"

## Usage
```
/game-search-review [game-type] [count]
```

Examples:
- `/game-search-review tetris 5` - Search for 5 tetris games
- `/game-search-review puzzle 10` - Search for 10 puzzle games
- `/game-search-review` - Run default search (all types, 20 games)

## Output
- Games published to: `games.edugamehq.com/review/[slug]`
- Review list saved to: `output/pending-review.json`
- Status: All games marked as `pending_review`

## Implementation

When this skill is invoked:

1. **Parse arguments**
   - Extract game type (default: all types)
   - Extract count (default: 20)

2. **Run search pipeline**
   ```bash
   cd scripts/batch-onboard
   node 1-search-games.mjs [type] [count]
   node 2-check-duplicates.mjs
   node 3-verify-url.mjs
   node 4-quality-score.mjs
   node 5-capture-screenshots.mjs
   node 6-generate-data.mjs
   ```

3. **Publish to review subdomain**
   - Add `status: "pending_review"` to each game
   - Add `reviewUrl: "https://games.edugamehq.com/review/[slug]"`
   - Save to `output/pending-review.json`

4. **Report results**
   - Total games found
   - Games passed validation
   - Review URL for each game
   - Next step: Use `/game-approve` to approve games

## Notes
- Games are NOT added to main games.json yet
- All games require manual review before going live
- Review interface shows game in iframe for testing
