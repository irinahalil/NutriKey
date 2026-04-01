---
name: frontend-design
description: >-
  Builds distinctive, production-grade web interfaces (HTML/CSS/JS or frameworks) with a
  clear visual identity and avoids generic “template” aesthetics. Use when creating or
  refactoring components, pages, landing sections, styling, typography, motion, or when the
  user asks for UI polish, layout, accessibility-aware design, or a bold cohesive art direction.
---

# Frontend design

## Instructions

When the user asks for frontend work, treat the task as **real shipping UI**, not a placeholder mock.

1. **Clarify context** — purpose, audience, constraints (framework, performance, accessibility).
2. **Pick one bold direction** — minimal, editorial, soft/pastel, brutalist, luxury, playful, etc. Execute it consistently; do not mix unrelated styles.
3. **Implement working code** — layout, states, responsive behavior; match complexity to the chosen vision.

## Design direction (before coding)

Commit to:

- **Purpose** — what problem the interface solves and for whom.
- **Tone** — one strong aesthetic lane (examples: brutally minimal, maximalist, retro-futuristic, organic, refined, toy-like, brutalist, art deco, industrial).
- **Differentiation** — one memorable hook (typography, motion beat, layout asymmetry, texture).

**Rule:** Intentionality over intensity — both refined minimalism and expressive maximalism are valid if executed cleanly.

## Frontend guidelines

- **Typography** — prefer characterful, well-paired fonts over default stacks; pair a display face with a readable body face when appropriate.
- **Color** — cohesive system via CSS variables; one dominant palette with sharp accents usually beats flat, evenly distributed color.
- **Motion** — purposeful micro-interactions; prefer CSS for static sites; one strong reveal (e.g. staggered `animation-delay`) beats scattered noise.
- **Composition** — deliberate layout: asymmetry, overlap, diagonal flow, grid breaks, or generous negative space — avoid generic centered “hero + three cards” without a reason.
- **Atmosphere** — depth over flat solids when it fits the direction: gradients, grain, patterns, layered transparency, shadows, borders — tied to the chosen tone.

## Anti-patterns

- Default “AI slop”: Inter/Roboto/Arial-only, purple-gradient-on-white clichés, cookie-cutter sections with no context.
- **Re-using the same trendy font** (e.g. Space Grotesk) across unrelated projects by habit.
- **Style without function** — inaccessible contrast, unreadable type, motion that harms usability.

## Complexity

Match implementation depth to the vision: maximalist UIs need richer structure and motion; minimal/refined UIs need spacing, type rhythm, and subtle detail — not more decoration.

## Additional terms

Project license: see [LICENSE](LICENSE) in the repository root.
