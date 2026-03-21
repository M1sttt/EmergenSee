# Client `any` Usage Audit

Generated: 2026-03-20
Scope: `apps/web/src` TypeScript files (`*.ts`, `*.tsx`)
Total locations: **40**

## Locations

1. `apps/web/src/components/DepartmentForm/DepartmentForm.tsx:55`
2. `apps/web/src/components/Layout/Layout.tsx:40`
3. `apps/web/src/components/Layout/Layout.tsx:46`
4. `apps/web/src/components/Layout/Layout.tsx:87`
5. `apps/web/src/components/Layout/Layout.tsx:88`
6. `apps/web/src/components/Layout/utils.ts:10`
7. `apps/web/src/components/Layout/utils.ts:13`
8. `apps/web/src/components/Layout/utils.ts:20`
9. `apps/web/src/components/Layout/utils.ts:25`
10. `apps/web/src/components/users/UserForm/UserForm.tsx:38`
11. `apps/web/src/components/users/UserForm/UserForm.tsx:66`
12. `apps/web/src/components/users/UserForm/UserForm.tsx:77`
13. `apps/web/src/components/users/UserForm/UserForm.tsx:97`
14. `apps/web/src/components/users/UserForm/UserForm.tsx:98`
15. `apps/web/src/components/users/UserForm/utils.ts:21`
16. `apps/web/src/hooks/data/useEventsData.ts:10`
17. `apps/web/src/hooks/data/useEventsData.ts:33`
18. `apps/web/src/hooks/useWebSocket.ts:5`
19. `apps/web/src/pages/EmergencyReportPage/utils.ts:7`
20. `apps/web/src/pages/EmergencyReportPage/utils.ts:9`
21. `apps/web/src/pages/EventsPage/EventsPage.tsx:121`
22. `apps/web/src/pages/EventsPage/EventsPage.tsx:161`
23. `apps/web/src/pages/LoginPage/LoginPage.tsx:35`
24. `apps/web/src/pages/LoginPage/LoginPage.tsx:64`
25. `apps/web/src/pages/LoginPage/LoginPage.tsx:82`
26. `apps/web/src/pages/StatusPage/StatusPage.tsx:64`
27. `apps/web/src/pages/StatusPage/StatusPage.tsx:78`
28. `apps/web/src/pages/StatusPage/StatusPage.tsx:97`
29. `apps/web/src/pages/StatusPage/StatusPage.tsx:150`
30. `apps/web/src/pages/StatusPage/StatusPage.tsx:165`
31. `apps/web/src/pages/StatusPage/utils.ts:15`
32. `apps/web/src/pages/StatusPage/utils.ts:16`
33. `apps/web/src/pages/StatusPage/utils.ts:21`
34. `apps/web/src/pages/StatusPage/utils.ts:51`
35. `apps/web/src/pages/StatusPage/utils.ts:54`
36. `apps/web/src/pages/UsersPage/utils.ts:21`
37. `apps/web/src/services/websocketService.ts:8`
38. `apps/web/src/services/websocketService.ts:45`
39. `apps/web/src/services/websocketService.ts:52`
40. `apps/web/src/services/websocketService.ts:56`

## Notes

- This file intentionally captures the pre-refactor state.
- Next step is to replace every `any` usage with specific types, utility types (`Partial`, etc.), or explicit unions/interfaces.
- Constraint: no `any` and no `as unknown` will be introduced during the refactor.

## Post-Refactor Verification

- `apps/web/src`: no `any` matches.
- `apps/web/src`: no `as unknown` matches.
- Validation commands passed:
	- `pnpm --filter @emergensee/web type-check`
	- `pnpm --filter @emergensee/web lint`
