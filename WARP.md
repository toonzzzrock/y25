# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 16 application with TypeScript, React 19, and Tailwind CSS v4. The project uses a multi-branch workflow with different branches serving distinct purposes:
- **main**: Production/stable branch (minimal content)
- **dev**: Development branch
- **stack**: Full application stack with Next.js setup
- **sql**: Database-related work

## Requirements

- Node.js v20+
- MySQL (required for database operations)
- npm (package manager)

## Development Commands

### Setup
```bash
npm install
```

### Development Server
```bash
npm run dev
# Starts Next.js development server with hot reload
# Default: http://localhost:3000
```

### Build
```bash
npm run build
# Creates optimized production build
```

### Production Server
```bash
npm start
# Runs production build (requires npm run build first)
```

### Linting
```bash
npm run lint
# Runs ESLint with Next.js configuration
```

Note: This project does NOT have a separate typecheck script. TypeScript checking happens during build.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **UI**: React 19 with Tailwind CSS v4
- **Language**: TypeScript 5 (strict mode enabled)
- **Linting**: ESLint 9 with Next.js config

### Project Structure
- Uses Next.js App Router (app directory)
- Path alias `@/*` maps to root directory
- TypeScript in strict mode with `noEmit` (type checking only)
- PostCSS for Tailwind CSS v4 processing

### Key Configuration
- **TypeScript**: Target ES2017, strict mode, no emit
- **ESLint**: Next.js core-web-vitals and TypeScript configs
- **Module Resolution**: Bundler mode (for Next.js compatibility)
- **JSX**: react-jsx transform (React 17+ automatic runtime)

### Branch Workflow
When working on features:
- Main development happens in the `stack` branch
- Check current branch context before making changes
- The main branch contains minimal placeholder content
