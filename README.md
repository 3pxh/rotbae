# Rotbae Monorepo

This is a monorepo containing multiple projects that will be deployed to different subdomains, all served from a single Netlify deployment.

## Structure

```
rotbae/
├── package.json     # Root package.json with build scripts
├── build-all.js     # Script to build all subdomain projects
├── dist/            # Build output (all subdomains)
│   └── stream/      # stream.rotbae.com build output
├── stream/          # stream.rotbae.com source
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── netlify.toml     # Netlify configuration with Host-based redirects
```

## Projects

### stream
- **Domain**: stream.rotbae.com
- **Tech Stack**: React + TypeScript + Vite
- **Build Command**: `npm run build:stream` (from root)
- **Output**: `dist/stream/` (after build-all)

## Build Scripts

From the root directory, you can run:

- `npm run build:all` - Automatically discovers and builds all projects (any directory with a `package.json`). Outputs are copied to `dist/{subdomain}/`
- `npm run build:stream` - Builds only the stream project
- `npm run dev:stream` - Runs the stream project in dev mode

The `build-all.js` script automatically:
- Finds all directories containing a `package.json` (excluding hidden dirs, node_modules, and dist)
- Installs dependencies in each project's directory (each uses its own npm environment)
- Builds each project in sequence using that project's own build scripts
- Copies each project's `dist/` folder to `dist/{subdomain}/` at the root
- Provides clear console output for each build step

## Netlify Deployment

This monorepo uses a **single Netlify deployment** that serves all subdomains from the `dist/` folder using Host-based redirects.

### Setup in Netlify Dashboard

1. **Create a single site** in Netlify dashboard
2. **Connect the repository**
3. **Configure DNS**: Set up catch-all DNS (wildcard DNS) to point `*.rotbae.com` to your Netlify site
4. Netlify will automatically use the configuration from `netlify.toml`

### How It Works

1. **Build**: Netlify runs `npm install && npm run build:all`, which:
   - Builds all projects in the monorepo
   - Copies each project's output to `dist/{subdomain}/`

2. **Deploy**: Netlify serves from the `dist/` folder

3. **Routing**: Host-based redirects in `netlify.toml` route each subdomain to its folder:
   - `stream.rotbae.com/*` → serves from `dist/stream/*`
   - SPA routing rules ensure client-side routes work correctly
   - Catch-all DNS (`*.rotbae.com`) routes all subdomains to Netlify, and the Host header determines which folder to serve

### Benefits

- **Single deployment**: One build, one deploy, easier to manage
- **Shared infrastructure**: All subdomains share the same Netlify site
- **Automatic discovery**: New projects are automatically included in builds
- **Isolated builds**: Each project uses its own npm environment and dependencies

## Adding New Projects

To add a new project (e.g., `admin` for `admin.rotbae.com`):

1. **Create the project folder** at the root:
   ```bash
   mkdir admin
   # ... set up your project in admin/
   ```

2. **The project will be automatically discovered** by `build-all.js` (no script changes needed)

3. **Add redirect rules** to `netlify.toml`:
   ```toml
   # admin.rotbae.com
   [[redirects]]
     from = "/*"
     to = "/admin/:splat"
     status = 200
     force = true
     conditions = {Host = ["admin.rotbae.com"]}
   
   # SPA routing for admin subdomain
   [[redirects]]
     from = "/admin/*"
     to = "/admin/index.html"
     status = 200
     conditions = {Host = ["admin.rotbae.com"]}
     force = false
   ```

That's it! The new subdomain will be automatically built and deployed with the next push. Since you're using catch-all DNS, no additional DNS or Netlify domain configuration is needed - the Host-based redirects will handle routing automatically.
