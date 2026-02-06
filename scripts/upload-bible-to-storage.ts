/**
 * Script to upload Bible USFM files to Supabase Storage
 *
 * Usage:
 *   npx ts-node scripts/upload-bible-to-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET_NAME = 'bible';

// Bible directories to upload
const BIBLE_DIRECTORIES = [
    'eng-web_usfm',
    'kor_usfm',
    'deu1912_usfm',
    'spablm_usfm',
    'fraLSG_usfm',
    'cmn-cu89s_usfm',
    'russyn_usfm',
    'vie1934_usfm',
];

async function ensureBucketExists() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!exists) {
        console.log(`Creating bucket: ${BUCKET_NAME}`);
        const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
        });
        if (error) {
            console.error('Failed to create bucket:', error);
            process.exit(1);
        }
        console.log('Bucket created successfully');
    } else {
        console.log(`Bucket ${BUCKET_NAME} already exists`);
    }
}

async function uploadDirectory(dirName: string) {
    const dirPath = path.join(process.cwd(), dirName);

    if (!fs.existsSync(dirPath)) {
        console.log(`Directory not found: ${dirPath}, skipping...`);
        return { uploaded: 0, skipped: 0, errors: 0 };
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.usfm'));
    console.log(`\nUploading ${files.length} files from ${dirName}...`);

    let uploaded = 0;
    let skipped = 0;
    let errors = 0;

    for (const fileName of files) {
        const filePath = path.join(dirPath, fileName);
        const storagePath = `${dirName}/${fileName}`;

        try {
            // Check if file already exists
            const { data: existingFile } = await supabase.storage
                .from(BUCKET_NAME)
                .list(dirName, { search: fileName });

            if (existingFile && existingFile.length > 0) {
                console.log(`  Skipping (exists): ${storagePath}`);
                skipped++;
                continue;
            }

            // Read and upload file
            const fileContent = fs.readFileSync(filePath);
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileContent, {
                    contentType: 'text/plain',
                    upsert: false,
                });

            if (error) {
                console.error(`  Error uploading ${storagePath}:`, error.message);
                errors++;
            } else {
                console.log(`  Uploaded: ${storagePath}`);
                uploaded++;
            }
        } catch (err) {
            console.error(`  Error processing ${fileName}:`, err);
            errors++;
        }
    }

    return { uploaded, skipped, errors };
}

async function main() {
    console.log('=== Bible USFM Upload Script ===\n');
    console.log(`Supabase URL: ${SUPABASE_URL}`);
    console.log(`Bucket: ${BUCKET_NAME}\n`);

    // Ensure bucket exists
    await ensureBucketExists();

    // Upload each directory
    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const dir of BIBLE_DIRECTORIES) {
        const result = await uploadDirectory(dir);
        totalUploaded += result.uploaded;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
    }

    console.log('\n=== Upload Complete ===');
    console.log(`Uploaded: ${totalUploaded}`);
    console.log(`Skipped (already exists): ${totalSkipped}`);
    console.log(`Errors: ${totalErrors}`);

    if (totalErrors > 0) {
        process.exit(1);
    }
}

main().catch(console.error);
