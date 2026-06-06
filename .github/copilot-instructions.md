# Kid-hub Project Standards

## Technical Stack
- **Framework:** Next.js (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS (Mobile-first, responsive).
- **Data Fetching:** Prioritize **Server Actions** for mutations and Server Components for data fetching.
- **Database:** Prisma ORM.
- **Package Manager:** Always use `pnpm`.
- **Formatting:** Follow the rules defined in .prettierrc (no semicolons, single quotes, 2-space indentation). Use the Tailwind CSS Prettier plugin for class sorting.

## Design Principles
- **Target Audience:** Child-friendly UI (5-year-old).
- **UI Guidelines:** Use large interactive elements, high-contrast colors, and clear typography. Avoid dense text blocks.
- **Accessibility:** Ensure all interactive elements have clear visual feedback and are easy to trigger on touch screens.

## Coding Patterns
- **Directory Structure:** Components should be inside `@/components`, logic in `@/lib`, and database schemas in `@/prisma`.
- **Naming Conventions:** Use PascalCase for components and camelCase for functions/variables.
- **Components:** Default to Server Components unless client-side interactivity (state, effects, events) is strictly required. Use the `'use client'` directive sparingly.
- **Error Handling:** Use `try/catch` in Server Actions and return a consistent response object: `{ success: boolean, data?: any, error?: string }`.

## Architectural Layers
- **UI Components:** Responsible only for rendering and user interaction. Call Server Actions for data.
- **Server Actions (@/actions):** Act as entry points. Handle validation (Zod), authorization, and call Services. Return standard `{ success: boolean, data?: T, error?: string }` objects.
- **Services (@/services):** Contain all business logic and direct database queries via Prisma.

## Coding & Documentation Standards
- **Language:** Code must be written entirely in English.
- **No Inline Comments:** Do not place comments inside function bodies or between logic steps.
- **Mandatory Headers:** - Every file must start with a block comment describing its purpose.
    - Every function must have a JSDoc-style comment block immediately above its definition explaining its responsibility.
- **Style:** Maintain clean, self-documenting code through descriptive naming.