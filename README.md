# Packaging Preview

Packaging Preview is a browser-based 3D packaging mockup tool for packaging designers. It maps uploaded artwork onto real package geometry so a design can be checked from multiple angles before production.

在线预览：<https://packaging-preview.winstedlason269.chatgpt.site>

## Features

- Six independent artwork uploads for box packaging.
- Front and back artwork for stand-up pouches and inner packaging.
- Full-UV artwork controls for inner packaging 1.
- Front, back, left, and right artwork for hanging tissue packaging.
- Separate artwork and finish state for box and pouch packaging.
- Five stackable finishes: gold foil, silver foil, holographic, spot UV, and emboss/deboss.
- Camera orbit, zoom, auto-rotate, and global upper-left studio-light intensity control.
- Local project save/load and transparent PNG export presets.
- Browser-local image processing; uploaded artwork is not sent to a server by the application.

## Supported packaging types

The current prototype includes box, stand-up pouch, inner packaging 1, inner packaging 2, hanging tissue, face tissue, and wet tissue.

## Local development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run test:sites
```

## Scope and privacy

This is a local-first prototype. It does not provide accounts, cloud project storage, AI recognition, dieline splitting, or automatic face assignment. Artwork is kept in browser memory or IndexedDB for local project workflows.

## License

Source code and documentation are released under the [MIT License](LICENSE). The supplied model and image assets under `public/models/` are project inputs; verify their redistribution and commercial-use rights independently before reusing them.
