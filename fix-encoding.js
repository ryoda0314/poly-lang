const fs = require('fs');
const path = require('path');

const files = [
    'src/app/app/layout.tsx',
    'src/components/ExplorerDrawer.tsx',
    'src/components/PhraseCard.tsx',
    'src/components/TokenizedSentence.tsx',
    'src/hooks/use-explorer.tsx',
    'src/app/app/phrases/page.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    try {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            // Remove BOM if present
            const cleanContent = content.replace(/^\uFEFF/, '');
            fs.writeFileSync(filePath, cleanContent, { encoding: 'utf8' });
            console.log(`Fixed: ${file}`);
        } else {
            console.log(`Missing: ${file}`);
        }
    } catch (e) {
        console.error(`Error fixing ${file}:`, e);
    }
});
