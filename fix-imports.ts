// Script to fix TypeScript imports for Deno compatibility
import { walk } from "https://deno.land/std@0.204.0/fs/walk.ts";
import { extname, join } from "https://deno.land/std@0.204.0/path/mod.ts";

// Define the patterns to fix
const patterns = [
  // Fix imports from whispurrnet/
  {
    regex: /from ['"]whispurrnet\/([^"']+)(?<!\.ts)['"]/g,
    replace: 'from "whispurrnet/$1.ts"',
  },
  // Fix relative imports
  {
    regex: /from ['"](?:\.\.?\/)*whispurrnet\/([^"']+)(?<!\.ts)['"]/g,
    replace: 'from "whispurrnet/$1.ts"',
  },
  // Fix relative imports without whispurrnet prefix
  {
    regex: /from ['"](?:\.\.?\/)+([^"']+)(?<!\.ts)['"]/g,
    replace: 'from "./$1.ts"',
  },
];

async function fixImportsInFile(filePath: string) {
  try {
    let content = await Deno.readTextFile(filePath);
    let modified = false;

    // Apply all patterns
    for (const { regex, replace } of patterns) {
      const newContent = content.replace(regex, replace);
      if (newContent !== content) {
        modified = true;
        content = newContent;
      }
    }

    // Write back if changes were made
    if (modified) {
      await Deno.writeTextFile(filePath, content);
      console.log(`✅ Fixed imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function main() {
  console.log("🔍 Finding TypeScript files...");
  
  // Process all TypeScript files in the project
  for await (const entry of walk(Deno.cwd(), {
    exts: [".ts"],
    skip: [
      /node_modules/,
      /\.git/,
      /\.vscode/,
      /dist/,
      /build/,
    ],
  })) {
    const filePath = entry.path;
    console.log(`📄 Processing ${filePath}...`);
    await fixImportsInFile(filePath);
  }
  
  console.log("\n✨ All done! Import fixes completed.");
}

// Run the script
main().catch(console.error);
