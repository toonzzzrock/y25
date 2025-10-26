# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Structure

This is a multi-branch repository with different purposes:
- **main**: Primary branch (currently minimal)
- **stack**: Next.js application (primary development branch for the web app)
- **dev**: Development experimentation branch
- **sql**: Database-related work

**Most active development occurs on the `stack` branch**, which contains the Next.js application.

## Technology Stack (stack branch)

- **Framework**: Next.js 16 with App Router
- **Runtime**: Node.js v20+
- **Language**: TypeScript 5 (strict mode enabled)
- **UI Framework**: React 19
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint 9 with Next.js config
- **Database**: MySQL (required for production)

## Essential Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Initial Setup
```bash
npm install          # Install dependencies
```

## Architecture

### Next.js App Router Structure
- Uses Next.js 16 App Router (not Pages Router)
- Entry point: `app/layout.tsx` (root layout)
- Main page: `app/page.tsx`
- TypeScript path alias: `@/*` maps to project root

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler
- JSX: react-jsx (React 19 automatic runtime)
- Path aliases configured with `@/*` for root imports

### Styling
- Tailwind CSS 4 with PostCSS
- Global styles in `app/globals.css`
- Fonts: Geist Sans and Geist Mono (Google Fonts)

## Key Development Notes

### Branch Workflow
When making changes, ensure you're on the correct branch:
- For web application work: `git checkout stack`
- Check current branch: `git branch`

### TypeScript Patterns
- All files use `.tsx` for components and `.ts` for utilities
- Strict type checking is enabled
- Use `type` for object shapes, prefer explicit typing

### Next.js Specifics
- This project uses the App Router (not Pages Router)
- Server Components are the default
- Use `"use client"` directive for client components
- Metadata is defined in layout files

### Linting
Always run `npm run lint` before committing changes to ensure code quality.

## Requirements

- Node.js v20 or higher
- MySQL (for database functionality)
- npm (comes with Node.js)
