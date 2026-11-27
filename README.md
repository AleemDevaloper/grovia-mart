# Grovia Mart

The active React storefront for Grovia Mart. It uses React, TypeScript, Vite, and a
separately deployed Laravel API.

## Local development

Requirements: Node.js and npm.

```powershell
npm install
npm run dev
```

Set `VITE_API_URL` in `.env.local` to the Laravel API base URL ending in `/api`. For
example, a local API at `http://127.0.0.1:8000` uses
`VITE_API_URL=http://127.0.0.1:8000/api`.

Run the production build and linter with:

```powershell
npm run build
npm run lint
```

## Deployment

The Laravel API is maintained separately in the
[Grovia Mart API repository](https://github.com/AleemDevaloper/grovia-mart-api).
Deploy that API first, then set `VITE_API_URL` in Vercel to its HTTPS URL ending in
`/api` and redeploy this frontend. Vercel uses `npm run build` and the `dist` output;
`vercel.json` configures client-side route handling.

Do not commit `.env.local`, production credentials, local database files, or uploaded
product images.

## Project documentation

- [Project documentation](./PROJECT_DOCUMENTATION.md)
- [Testing guide](./TESTING.md)
- [Animation system](./ANIMATION_SYSTEM.md)
