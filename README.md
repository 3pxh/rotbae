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

This monorepo uses a **single Netlify deployment** that serves all subdomains from the `dist/` folder using an Edge Function for Host-based routing.

### Setup in Netlify Dashboard

1. **Create a single site** in Netlify dashboard
2. **Connect the repository**
3. **Configure DNS**: Set up catch-all DNS (wildcard DNS) to point `*.rotbae.com` to your Netlify site
4. **Edge Functions**: No special GUI configuration needed! Edge Functions are automatically detected from the `netlify/edge-functions/` directory and declared in `netlify.toml`. They will deploy automatically with your site.

5. **Add domain aliases** (optional but recommended for each subdomain):
   - Go to Site settings → Domain management
   - Add each subdomain (e.g., `stream.rotbae.com`) as a custom domain alias
   - This enables direct access via the subdomain
   - **Note**: Projects are also accessible via `rotbae.com/{project}/` without domain aliases

6. Netlify will automatically use the configuration from `netlify.toml` and deploy the Edge Function

### How It Works

1. **Build**: Netlify runs `npm install && npm run build:all`, which:
   - Builds all projects in the monorepo
   - Copies each project's output to `dist/{subdomain}/`

2. **Deploy**: Netlify serves from the `dist/` folder

3. **Routing**: An Edge Function (`netlify/edge-functions/subdomain-router.ts`) reads the `Host` header and rewrites requests:
   - `stream.rotbae.com/*` → serves from `dist/stream/*`
   - `rotbae.com/*` → serves from `dist/stream/*`
   - SPA routing rules in `netlify.toml` handle client-side routes that don't exist as files
   - Catch-all DNS (`*.rotbae.com`) routes all subdomains to Netlify, and the Edge Function uses the Host header to determine which folder to serve

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
   cd admin
   npm create vite@latest .
   ```
   React, Typescript, Typescript + React Compiler, default options for whatever else.

2. **Configure the base path** in the project's `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/admin/',  // Must match the folder name
     // ... rest of config
   })
   ```
   This ensures assets load from `/admin/assets/` instead of `/assets/`, which is required for the monorepo structure.

3. **Update the Edge Function** (`netlify/edge-functions/subdomain-router.ts`):
   - Add the subdomain to the `knownSubdomains` array:
     ```typescript
     const knownSubdomains = ['stream', 'admin']; // Add 'admin' here
     ```
   - Add the host mapping (optional, for direct subdomain access):
     ```typescript
     const hostMap: Record<string, string> = {
       'rotbae.com': 'stream',
       'www.rotbae.com': 'stream',
       'stream.rotbae.com': 'stream',
       'admin.rotbae.com': 'admin',  // Add this line
     };
     ```

4. **Add SPA routing redirect** to `netlify.toml`:
   ```toml
   # SPA routing for admin subdomain
   [[redirects]]
     from = "/admin/*"
     to = "/admin/index.html"
     status = 200
     force = false
   ```

5. **Add domain alias in Netlify** (optional but recommended):
   - Go to Netlify Dashboard → Site settings → Domain management
   - Add `admin.rotbae.com` as a custom domain alias
   - This allows direct access via the subdomain
   - **Note**: You can also access it via `rotbae.com/admin/` without adding the domain alias

That's it! The new subdomain will be automatically built and deployed with the next push. The Edge Function will handle routing based on the Host header, and assets will load correctly from the project's folder path.
