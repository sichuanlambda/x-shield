# X XXX Blocker

Chrome extension that blocks X/Twitter pages when profile text, posts, emojis,
links, or sensitive-media gates indicate adult content.

## Install (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `/Users/nathan/Projects/x xxx blocker`

## What gets blocked

- Profile bio text and display name (keywords like porn, 18+, OnlyFans)
- Profile emojis (🔞)
- Profile links (OnlyFans)
- Post text and links (keywords like porn, 18+, OnlyFans)
- Sensitive-media interstitials (View/Show/See/Display gates)

## Customize rules

Edit the lists at the top of `content.js`:

- `BLOCKED_EMOJI`
- `BLOCKED_KEYWORDS`
- `BLOCKED_LINK_KEYWORDS`
- `SENSITIVE_MEDIA_TEXTS`
- `SENSITIVE_VIEW_LABELS`
