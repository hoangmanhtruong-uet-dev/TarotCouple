---
description: Mandatory TypeScript and Vercel environment verification before pushing to origin/main
---
1. Always run `npx tsc --noEmit` in addition to `npx vitest run` before `git commit` / `git push` to guarantee zero TypeScript compilation errors on Vercel.
2. When advising the user on Vercel Environment Variables, explicitly remind them to enable all 3 scopes (`Production`, `Preview`, `Development`) so production deployments receive the keys.
