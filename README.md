# Giovanni's Room — An Interactive Journey

A short, first-person 3D exploration game based on James Baldwin's novel *Giovanni's Room* (1956). You play as David and walk through five scenes of his memory — the house in the south of France, his father's living room, Guillaume's bar, Giovanni's room, and Hella's return — talking to the novel's characters, making dialogue choices, and collecting six evidence cards that tie the story to its central theme: **Identity / Self-Expression**. A full playthrough takes about 5–10 minutes.

## How to run

No build step. Serve this folder with any static server and open it in desktop Chrome:

```
npx serve .          # or: python3 -m http.server
```

Then open the printed local address (e.g. http://localhost:3000 or http://localhost:8000). An internet connection is required (Three.js is loaded from a CDN).

## Controls

| Action | Key |
| --- | --- |
| Move | WASD or Arrow keys |
| Look | Mouse (click the screen to lock the cursor) |
| Interact | E (when a prompt is shown) |
| Continue dialogue | Click or E |
| Pause / journal | Esc |

## Note for the teacher

The six collectible evidence cards are **direct quotations** from the novel, each labelled with its Part and Chapter (Part One, Chapters 1–3; Part Two, Chapters 1 and 4). Because page numbers shift between editions, Part and Chapter are given as the reliable reference; the in-text page citations stay within the length of the class copy. An in-game **For the Teacher** screen summarizes how the game covers the characters, plot, central conflict, theme, citations, and interactivity.
