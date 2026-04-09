
import json

filename = "c:/Users/edama/Desktop/poly-lang/dataset_tokenized_modeB.json"

with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '"lang": "vi"' in line:
        print(f"Found vi at line {i+1}")
        # Print a few lines context
        print("".join(lines[i:i+20]))
        break
