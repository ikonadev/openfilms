# OpenFilms Electron App

## Overview
Develop a beautiful, neat, and clean desktop movie streaming application using Electron, React, and Node.js. The visual design will be based on the color scheme of `banner.png`. The application will incorporate the player concepts from the `Token Aloha` template and utilize the Kinopoisk/IMDB/TMDB ID search and extraction logic from `Tape-Operator-main`.

## Project Type
WEB/DESKTOP (Electron with React)

## Success Criteria
- [ ] Electron app launches successfully with a React frontend.
- [ ] UI is visually stunning ("красивое"), neat, and utilizes the color palette from `banner.png`.
- [ ] Search functionality successfully parses movie IDs and metadata using logic ported from Tape-Operator.
- [ ] Player successfully integrates the Token Aloha player patterns and plays the selected content.

## Tech Stack
- **Framework**: Electron + React (via Vite)
- **Styling**: Vanilla CSS (CSS variables for design tokens) - Tailwind is avoided as per web application development guidelines.
- **Backend/Main Process**: Node.js

## File Structure
```
openfilms/
├── .agents/
├── src/
│   ├── main/          # Electron Main Process (Node.js)
│   ├── renderer/      # React Frontend
│   │   ├── components/
│   │   │   ├── Player/
│   │   │   ├── Search/
│   │   │   └── UI/
│   │   ├── styles/
│   │   │   └── design-tokens.css
│   │   └── App.jsx
│   └── shared/        # Shared logic (ID parsing)
├── package.json
└── vite.config.js
```

## Task Breakdown

### 1. Initialize Project & Environment
- **Agent**: `orchestrator` / `frontend-specialist`
- **Skill**: `app-builder`
- **INPUT**: Empty directory
- **OUTPUT**: Vite + Electron + React scaffolded.
- **VERIFY**: `npm run dev` starts the Electron app.

### 2. Design System & Aesthetics
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: `banner.png`
- **OUTPUT**: `design-tokens.css` with extracted colors, gradients, and micro-animations.
- **VERIFY**: CSS file contains valid variables and test UI component renders beautifully.

### 3. Port Search & Extraction Logic
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`
- **INPUT**: `Tape-Operator-main/userscript/tape-operator.user.js`
- **OUTPUT**: Utilities in `src/shared/parser.js` for IMDB/TMDB/Kinopoisk.
- **VERIFY**: Unit tests or manual tests confirm correct ID extraction from URLs/Strings.

### 4. Build the Search UI & Integration
- **Agent**: `frontend-specialist`
- **Skill**: `react-expert`
- **INPUT**: Parser utilities
- **OUTPUT**: A beautiful search bar and results component with glassmorphism.
- **VERIFY**: User can input a movie name or link and get parsed results.

### 5. Implement Player Component
- **Agent**: `frontend-specialist`
- **Skill**: `react-expert`
- **INPUT**: `Token Aloha` player concepts
- **OUTPUT**: Video player component or iframe embedder in `src/renderer/components/Player`.
- **VERIFY**: Player successfully loads and plays video streams based on the parsed ID.

### 6. Final Polish & Assembly
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: All components
- **OUTPUT**: Finished beautiful UI with routing, animations, and transitions.
- **VERIFY**: The app works end-to-end flawlessly.

## Phase X: Verification
- [ ] Lint: Check code quality
- [ ] Security: Verify no exposed secrets
- [ ] Build: `npm run build` succeeds
- [ ] UI/UX Audit: Beautiful, neat, no standard templates
