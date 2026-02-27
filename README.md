# BioScanner Pro

![Deploy to GitHub Pages](https://github.com/dunn0172/biospecimen-vue-scanner/actions/workflows/deploy.yml/badge.svg)

A modern, high-efficiency web application for 96-well biospecimen plate scanning.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Run development server**:
   ```bash
   bun dev
   ```

3. **Build for production**:
   ```bash
   bun run build
   ```

## 🛠 Tech Stack

- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Styling**: Vanilla CSS (Glassmorphism / Modern Aesthetics)
- **Build Tool**: Vite
- **Package Manager**: Bun
- **Utilities**: PapaParse (CSV), Lucide Vue Next (Icons)

## 📁 Project Structure

- `src/App.vue`: Primary application layout and UI logic.
- `src/stores/plateStore.ts`: Core logic for plate management, scanning order, and data state.
- `src/style.css`: Global design system and theme variables.
- `src/components/`: Reusable UI components.

## 🤖 AI Coding Agents

This project includes configuration files to help AI agents understand coding standards and architectural patterns:
- `.cursorrules`: Guidelines for Cursor/Windsurf.
- `.clinerules`: Guidelines for Cline/Roo-Code.
- `.agents/hints.md`: General agent instructions.

## 🌐 Deployment

This project is configured to automatically deploy to **GitHub Pages** via GitHub Actions.
- **Workflow**: `.github/workflows/deploy.yml`
- **Trigger**: Every push to the `main` branch.
- **Configuration**: The `base` path in `vite.config.ts` is set to `/biospecimen-vue-scanner/`.

## 🤖 Maintenance

- **Dependabot**: Weekly updates for npm dependencies and GitHub Actions are configured in `.github/dependabot.yml`.

Please refer to these files when adding new features or refactoring code.
