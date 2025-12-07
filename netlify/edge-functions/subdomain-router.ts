// Edge Function to route requests based on Host header
// Maps subdomains to their corresponding folders in dist/

export default async (request: Request) => {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';
  const pathname = url.pathname;

  // List of known subdomain folders (update when adding new projects)
  const knownSubdomains = ['stream', 'admin']; // Add new projects here
  
  // Map of host patterns to subdomain folders
  const hostMap: Record<string, string> = {
    'rotbae.com': 'stream',
    'www.rotbae.com': 'stream',
    'stream.rotbae.com': 'stream',
  };

  // Check if pathname already starts with a known subdomain folder
  // This handles direct access like rotbae.com/admin/ or rotbae.com/stream/
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && knownSubdomains.includes(pathParts[0])) {
    // Path already includes a subdomain folder - pass through
    // This handles cases like /admin/assets/... or /stream/index.html
    return;
  }

  // Find matching subdomain from host
  let subdomain = hostMap[host];
  
  // If no exact match, try to extract subdomain from host
  if (!subdomain) {
    const hostParts = host.split('.');
    if (hostParts.length >= 3 && hostParts[hostParts.length - 2] === 'rotbae') {
      // Extract subdomain (first part before rotbae.com)
      const potentialSubdomain = hostParts[0];
      // Default to stream for now, but you can add logic to check if folder exists
      subdomain = potentialSubdomain === 'www' ? 'stream' : potentialSubdomain;
    } else {
      // Root domain or unknown - default to stream
      subdomain = 'stream';
    }
  }

  // Build the new path
  let newPath: string;
  
  if (pathname === '/') {
    // Root path - serve index.html
    newPath = `/${subdomain}/index.html`;
  } else {
    // Route to subdomain folder
    // This handles cases like /assets/... or /some/path
    newPath = `/${subdomain}${pathname}`;
  }

  // Rewrite the request to the new path by returning a URL object
  return new URL(newPath, url.origin);
};

export const config = {
  path: '/*',
};
