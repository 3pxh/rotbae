const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const subdomains = fs.readdirSync('.')
  .filter(file => {
    const filePath = path.join('.', file);
    return fs.statSync(filePath).isDirectory() && 
           !file.startsWith('.') &&
           file !== 'node_modules' &&
           file !== 'dist' &&
           fs.existsSync(path.join(filePath, 'package.json'));
  });

if (subdomains.length === 0) {
  console.log('No subdomains found to build.');
  process.exit(0);
}

// Create dist directory
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Install utilities dependencies first (required by subdomains)
if (fs.existsSync('utilities/package.json')) {
  console.log('\n=== Installing utilities dependencies ===');
  try {
    execSync('npm install', {
      cwd: 'utilities',
      stdio: 'inherit'
    });
    console.log('✓ Utilities dependencies installed');
  } catch (error) {
    console.error('✗ Failed to install utilities dependencies:', error.message);
    process.exit(1);
  }
}

subdomains.forEach(subdomain => {
  console.log(`\n=== Building ${subdomain} ===`);
  try {
    // Install dependencies first (uses each package's own package.json)
    console.log(`Installing dependencies for ${subdomain}...`);
    execSync('npm install', { 
      cwd: subdomain, 
      stdio: 'inherit' 
    });
    
    // Build using the package's own npm environment
    console.log(`Building ${subdomain}...`);
    execSync('npm run build', { 
      cwd: subdomain, 
      stdio: 'inherit' 
    });
    
    // Copy build output to dist folder
    const source = path.join(subdomain, 'dist');
    const dest = path.join('dist', subdomain);
    
    if (fs.existsSync(source)) {
      // Remove existing destination if it exists
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.cpSync(source, dest, { recursive: true });
      console.log(`✓ ${subdomain} built and copied to dist/${subdomain}`);
    } else {
      console.warn(`⚠ Warning: ${subdomain}/dist not found after build`);
    }
  } catch (error) {
    console.error(`✗ Failed to build ${subdomain}:`, error.message);
    process.exit(1);
  }
});

console.log('All subdomains built successfully!');
