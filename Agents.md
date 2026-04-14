# Cursor AI Agent — Guidelines (Concise)

Project: Mobile document management + daily compliance checklists.
Stack: Expo React Native with a Firebase-first mobile app architecture (Auth/Firestore/Storage). Node/Express is optional or future work if backend services are added to the repo.

Core Rules (must follow)
- Functional components + hooks only.
- All Firebase calls through /services.
- Local UI state; global state via Context.
- Use StyleSheet.create(); styles at file bottom.
- Naming: Components PascalCase; files: component files PascalCase (e.g., UserProfile.js), utility/service files camelCase (e.g., authService.js), config/static files kebab-case (e.g., firebase-config.js); constants UPPER_SNAKE_CASE.
- Use FlatList for lists; React.memo for expensive components.

Security & Config
- Keep Firebase config in .env and gitignored.
- Enforce Firestore/Storage security rules.
- Validate and sanitize inputs client/server.
- Use Firebase App Check when available.

Important Checks (quick)
- Auth: Firebase auth observer; guard routes.
- Async: try/catch; map err.code → friendly messages.
- Realtime: unsubscribe listeners on unmount.
- Offline: enable Firestore persistence; handle sync errors.
- Files: validate size/type before upload; show progress/errors.
- Accessibility: accessibilityLabel on interactive elements.
- Performance: debounce search, paginate queries, batch writes.

Mock Data
- Use /utils/mockData.js matching Firestore shape for easy swap.

Pre-PR Checklist
- Functional components/hooks used
- No hard-coded secrets
- Loading/empty/error states handled
- Lists use FlatList; images lazy-loaded
- Listeners unsubscribed; no console warnings
- Accessibility labels present
- Commit message follows Conventional Commits

Agent Behavior (short)
- Start simple; one feature at a time.
- Ask before major architecture changes.
- Document deviations from guidelines in PR descriptions.

Next priorities
1. Owner onboarding gate
2. Dashboard readiness
3. Inspection readiness screen
4. Compliance score v2
~5. Team model
