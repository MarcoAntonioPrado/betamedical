// Vercel Serverless Function — entry point for the Express API.
// Vercel compiles this file with esbuild, which resolves .js imports to .ts.
// The build command (vercel.json) must run `npm run build --workspace shared`
// before this function is compiled so that @atlasmed/shared/dist exists.

import { app } from '../backend/src/app.js'

export default app
