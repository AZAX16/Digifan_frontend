# DigiFan

React, TypeScript, Vite, and Tailwind CSS foundation for the DigiFan storefront.

The current application renders the living `TestUIKit` page at the root. It includes design tokens, action controls, fields, selection controls, feedback patterns, loading states, pagination, and Figma-derived commerce cards.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## UI kit

- Components: `src/components/ui`
- Barrel export: `src/components/ui/index.ts`
- Showcase: `src/pages/TestUIKit.tsx`
- Design tokens: `src/styles/index.css`
- Persisted Figma assets: `src/assets`

Reusable components should be exported through the UI barrel and demonstrated on `TestUIKit` with their relevant variants and states.
