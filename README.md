# Minecraft Bot Website

Standalone website repository (frontend only).

## Start

1. Install dependencies:
   npm install
2. Start dev server:
   npm run dev
3. Build production:
   npm run build
4. Preview production build:
   npm run preview

## API backend

This website expects the backend bot API at `http://localhost:3000` during development.
Vite proxy forwards `/api/*` requests to that backend.
