const fs = require('fs');
const glob = require('glob');

// Setup Supabase App API Routes
const apiFiles = [
  './src/app/api/portfolio/route.ts',
  './src/app/api/transactions/route.ts',
  './src/app/api/trade/buy/route.ts',
  './src/app/api/trade/sell/route.ts',
  './src/app/api/trade/order/route.ts'
];

apiFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace imports
    content = content.replace("import { getServerSession } from 'next-auth';", "import { createClient } from '@/lib/supabase/server';");
    content = content.replace("import { authOptions } from '@/lib/auth';", "");
    
    // Replace session getting logic
    content = content.replace("const session = await getServerSession(authOptions);", "const supabase = createClient();\n    const { data: { user } } = await supabase.auth.getUser();\n    const session = user ? { user } : null;");

    fs.writeFileSync(file, content);
  }
});

// Setup Frontend Components
const componentFiles = [
  './src/components/TopNav.tsx',
  './src/components/Navbar.tsx',
  './src/components/TradingModal.tsx'
];

componentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import \{ useSession(, signOut)? \} from 'next-auth\/react';/g, "import { useSession$1 } from '@/components/AuthContext';");
    console.log("Updated", file);
    fs.writeFileSync(file, content);
  }
});

// Providers
const providersFile = './src/components/Providers.tsx';
if (fs.existsSync(providersFile)) {
  let content = fs.readFileSync(providersFile, 'utf8');
  content = content.replace("import { SessionProvider } from 'next-auth/react';", "import { AuthProvider } from '@/components/AuthContext';");
  content = content.replace("<SessionProvider>", "<AuthProvider>");
  content = content.replace("</SessionProvider>", "</AuthProvider>");
  fs.writeFileSync(providersFile, content);
}
