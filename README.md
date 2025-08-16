# MagicFridge 🍳

AI‑assisted kitchen companion: track inventory, assemble dishes, generate recipes, cook with timed step guidance, chat with an AI helper, cache aggressively, and auto‑generate images.

---

## Highlights

- Inventory categories with freshness status; select items to form a "Dish".
- One‑click recipe generation from a Dish.
- Recipe list: search / filter / sort / favorite (local persistence).
- Recipe detail: validated fetch + local cache + lazy hero image generation.
- Cooking mode: step focus, global & per‑step timers, keyboard control, embedded AI Q&A.
- AI chat (Groq) with contextual prompt (current recipe, step, progress).
- Image generation with hero cache + in‑flight dedupe.
- Layered localStorage caching & recovery (favorites, sessions, images, recipe lists).

---

## Tech Stack

React Router v7 (SSR + Data APIs)  
TypeScript · Vite 6 · Tailwind CSS 4  
Server action proxy for Groq Chat  
LocalStorage as lightweight persistence  
External lightweight APIs (recipe / image / chat)

---

## Quick Start

```bash
npm install
npm run dev         # SSR + HMR
```

Visit: http://localhost:5173

---

## Environment

| Name | Required | Purpose |
|------|----------|---------|
| GROQ_API_KEY | Yes | Server chat proxy (/api.chat) |

`.env` example:
```
GROQ_API_KEY=sk-xxxx
```

(Recipe & image demo tokens are front-end only for demo—move them server‑side in production.)

---

## Minimal Directory Glimpse

```
app/
  routes/ (home, recipes, RecipeDetail, cooking, inventory, api.chat)
  components/ (CookingChat, FloatingNav)
  services/ (inventoryContext, recipeApi)
  root.tsx
```

---

## Core Caching (LocalStorage Keys)

- Recipe detail: recipeDetail:<params>
- Recipe list page: magicfridge_recipes_page
- Random dish names: magicfridge_random_dishes / magicfridge_recipes_dish_names
- Hero images: recipeHero:<encodedName>
- Favorites: magicfridge_favorites
- Cooking session recovery: cookingSession:v1

Strategies: in‑flight promise dedupe for images, minimal reload interval, selective forced refresh, structural validation before caching.

---

## Cooking Mode

- Focused step scroll & highlight
- Global + per‑step timers (pause / reset)
- Keyboard: ← / ↑ previous, → / ↓ / Space next
- AI suggestions (substitutions, timing, safety)
- Session resume on refresh

---

## AI Chat Flow

1. Front-end builds context (title, ingredients, current step, user question).
2. POST /api.chat (server action) adds system prompt & calls Groq (`llama-3.3-70b-versatile` by default).
3. Returns reply + optional usage.
4. Can be extended to streaming by enabling `stream:true`.

---

## Image Generation

Lazy hero request per missing image, serialized to limit noise, cached by recipe name. Fallback placeholders recommended (add in production).

---

## Security Notes (Condensed)

| Current Demo | Recommended Production |
|--------------|------------------------|
| Front-end embedded external tokens | Move behind server proxy + rate limit |
| Unlimited local cache growth | Add TTL / LRU eviction |
| No auth | Introduce accounts for multi-user separation |
| No error monitoring | Add Sentry / logging pipeline |
| External API dependency | Provide graceful fallbacks |

---



Happy Cooking! 🍽
