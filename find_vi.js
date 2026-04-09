
const fs = require('fs');

const filename = "c:/Users/edama/Desktop/poly-lang/dataset_tokenized_modeB.json";

const content = fs.readFileSync(filename, 'utf-8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"lang": "vi"')) {
        console.log(`Found vi at line ${i + 1}`);
        console.log(lines.slice(i, i + 20).join('\n'));
        break;
    }
}
