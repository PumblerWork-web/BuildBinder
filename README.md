# The Build Binder

A React/Vite/TypeScript conversion of **The Build Binder v0.3**: a digital-first, blueprint-style workspace for vehicle restoration projects.

The seeded **Wild Plum XA** project remains a clearly labelled showcase. Vehicle claims and specifications marked **TO VERIFY** are intentionally not presented as confirmed facts.

## Add this package to GitHub without installing npm locally

1. Extract `BuildBinder-React-Vite-v0.3.0.zip`.
2. Open the target GitHub repository in a browser.
3. Choose **Add file → Upload files**.
4. Drag the **contents inside** the extracted `BuildBinder` folder into the repository root, then commit.
5. In Vercel, import the repository. Vercel detects Vite and installs/builds the dependencies in the cloud.

The included `dist/` folder is a verified production build and can also be used as a static deployment; no local npm installation is needed for either upload route. Vercel installs the source dependencies in its own build environment.

## Local development (optional)

Only needed if a developer wants to edit and run the source locally:

```bash
npm ci
npm run dev
```

Production check:

```bash
npm run build
npm run preview
```

## Project structure

```text
BuildBinder/
├── public/                   # PWA manifest, service worker and favicon
├── src/
│   ├── lib/buildBinder.ts    # Local-first binder data and interaction engine
│   ├── App.tsx               # React application shell
│   ├── main.tsx              # React/Vite entry point
│   └── styles.css            # Preserved v0.3 blueprint design
├── index.html
├── package.json
├── tsconfig*.json
├── vercel.json
└── vite.config.ts
```

## Preserved functionality

- Multiple restoration projects
- Per-project image/logo and open-ended photo galleries
- Auto-growing notes and editable project fields
- Registers, checklists, row add/delete and quick-add workflows
- Browser `localStorage` persistence using the existing `theBuildBinder.v1` key
- Compatible migration of earlier fixed-slot photos into v0.3 galleries
- JSON export/import backups
- Command palette (`Ctrl+K` / `Cmd+K`)
- Responsive desktop, tablet and mobile navigation
- Density, contrast and accent preferences
- Per-project cost tracking visibility, including a choice when creating new projects
- Print preview
- PWA manifest and runtime offline cache
- No runtime CDN dependency and no project-data transmission

## Data and privacy

Project data remains in the browser's `localStorage`. Photos are resized and stored as compressed WebP data URLs. Clearing site data removes the local record, so export backups regularly from **Data & backup**.

## Migration note

For this initial conversion, React owns the stable application shell while `src/lib/buildBinder.ts` preserves the proven v0.3 local-first data and rendering engine. This keeps existing storage compatibility and behaviour intact while placing the app in a standard React/Vite/TypeScript repository that can be progressively componentised in later releases.
