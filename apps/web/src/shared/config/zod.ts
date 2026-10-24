import { z } from 'zod'

// Zod 4 probes `new Function` to JIT-compile object parsers, at schema-creation time. Production's
// Content-Security-Policy (vercel.json) forbids `unsafe-eval`, so the probe is reported as a violation;
// parsing without JIT is equivalent here. This module MUST be the first import of the app entry
// (src/main.tsx): ES imports are evaluated before the importing module's body, so configuring Zod there
// would run after every schema in the app had already been created.
z.config({ jitless: true })
