import type { ScriptSet, ScriptCharacter } from './types';

export interface LessonSet {
    id: string;
    name: string;
    nameNative: string;
    characters: ScriptCharacter[];
    characterIds: string[];
    order: number;
}

/**
 * Generate lesson sets from a script's categories.
 * Small categories (< minSize) are merged with the next category.
 */
export function generateLessonSets(script: ScriptSet, minSize = 4): LessonSet[] {
    const sets: LessonSet[] = [];
    let pending: { names: string[]; namesNative: string[]; chars: ScriptCharacter[] } | null = null;

    for (const cat of script.categories) {
        const catChars = script.characters.filter(c => c.category === cat.id);
        if (catChars.length === 0) continue;

        if (pending) {
            // Merge into pending
            pending.names.push(cat.name);
            pending.namesNative.push(cat.nameNative);
            pending.chars.push(...catChars);

            if (pending.chars.length >= minSize) {
                sets.push({
                    id: `${script.id}--${sets.length}`,
                    name: pending.names.join(" / "),
                    nameNative: pending.namesNative.join(" / "),
                    characters: pending.chars,
                    characterIds: pending.chars.map(c => c.id),
                    order: sets.length,
                });
                pending = null;
            }
        } else if (catChars.length < minSize) {
            // Start a pending merge
            pending = {
                names: [cat.name],
                namesNative: [cat.nameNative],
                chars: [...catChars],
            };
        } else {
            sets.push({
                id: `${script.id}--${sets.length}`,
                name: cat.name,
                nameNative: cat.nameNative,
                characters: catChars,
                characterIds: catChars.map(c => c.id),
                order: sets.length,
            });
        }
    }

    // Flush remaining pending
    if (pending) {
        if (sets.length > 0 && pending.chars.length < minSize) {
            // Merge into last set
            const last = sets[sets.length - 1];
            last.name += " / " + pending.names.join(" / ");
            last.nameNative += " / " + pending.namesNative.join(" / ");
            last.characters.push(...pending.chars);
            last.characterIds.push(...pending.chars.map(c => c.id));
        } else {
            sets.push({
                id: `${script.id}--${sets.length}`,
                name: pending.names.join(" / "),
                nameNative: pending.namesNative.join(" / "),
                characters: pending.chars,
                characterIds: pending.chars.map(c => c.id),
                order: sets.length,
            });
        }
    }

    return sets;
}
