# AI Agent Hints

## Architecture
- **App.vue**: Main layout and coordination.
- **plateStore.ts**: Contains the 96-well plate state and transition logic.
- **Bun**: Used for all package management.

## Guidelines
- Follow the "Premium UI" directive: use gradients, backdrop blurs, and consistent spacing.
- Ensure that scanning workflows are intuitive (auto-focusing on the input).
- Maintain the column/row scanning logic in the store, not the view.

## Commands
```bash
bun dev
bun run build
```
