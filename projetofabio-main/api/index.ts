// Vercel Serverless Function — entry point for the Express API.
// Imports the pre-compiled backend (built during the Vercel buildCommand)
// so esbuild does not need to re-bundle TypeScript source files.

import { app } from '../backend/dist/app.js'

export default app
