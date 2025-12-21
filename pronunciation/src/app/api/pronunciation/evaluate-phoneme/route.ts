import { NextRequest, NextResponse } from 'next/server';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { createServerClient } from '@/lib/supabase-server';
import { spawn, execSync } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Get ffmpeg path - try multiple locations
function getFFmpegPath(): string {
    // 1. Try @ffmpeg-installer/ffmpeg package
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
        if (ffmpegInstaller?.path && existsSync(ffmpegInstaller.path)) {
            return ffmpegInstaller.path;
        }
    } catch {
        // Package not found
    }

    // 2. Try winget install location
    const wingetPath = 'C:\\Users\\ryoda\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
    if (existsSync(wingetPath)) {
        return wingetPath;
    }

    // 3. Try to find in PATH using where command
    try {
        const result = execSync('where ffmpeg', { encoding: 'utf-8' }).trim().split('\n')[0];
        if (result && existsSync(result)) {
            return result;
        }
    } catch {
        // Not in PATH
    }

    // 4. Fallback to system ffmpeg (will fail if not in PATH)
    return 'ffmpeg';
}

// Convert webm to wav using ffmpeg
async function convertToWav(inputBuffer: ArrayBuffer): Promise<Buffer> {
    const tempId = randomUUID();
    const inputPath = join(tmpdir(), `input_${tempId}.webm`);
    const outputPath = join(tmpdir(), `output_${tempId}.wav`);
    const ffmpegPath = getFFmpegPath();

    try {
        // Write input file
        await writeFile(inputPath, Buffer.from(inputBuffer));

        // Convert to WAV (16kHz mono PCM for Azure Speech)
        await new Promise<void>((resolve, reject) => {
            const ffmpeg = spawn(ffmpegPath, [
                '-i', inputPath,
                '-ar', '16000',      // 16kHz sample rate
                '-ac', '1',          // Mono
                '-f', 'wav',         // WAV format
                '-acodec', 'pcm_s16le', // 16-bit PCM
                '-y',                // Overwrite
                outputPath
            ]);

            let stderr = '';
            ffmpeg.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            ffmpeg.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
                }
            });

            ffmpeg.on('error', (err) => {
                reject(new Error(`ffmpeg error: ${err.message}`));
            });
        });

        // Read output file
        const wavBuffer = await readFile(outputPath);
        return wavBuffer;
    } finally {
        // Cleanup temp files
        try {
            await unlink(inputPath);
            await unlink(outputPath);
        } catch {
            // Ignore cleanup errors
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;
        const sentenceId = formData.get('sentenceId') as string | null;
        const expectedText = formData.get('expectedText') as string | null;

        if (!audioFile) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
        }
        if (!sentenceId) {
            return NextResponse.json({ error: 'Sentence ID is required' }, { status: 400 });
        }
        if (!expectedText) {
            return NextResponse.json({ error: 'Expected text is required' }, { status: 400 });
        }

        const speechKey = process.env.AZURE_SPEECH_KEY;
        const speechRegion = process.env.AZURE_SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            return NextResponse.json(
                {
                    error: 'Azure Speech Services not configured. Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local',
                    mode: 'phoneme'
                },
                { status: 500 }
            );
        }

        // Convert audio to WAV format
        const audioBuffer = await audioFile.arrayBuffer();
        let wavBuffer: Buffer;

        try {
            wavBuffer = await convertToWav(audioBuffer);
        } catch (conversionError) {
            console.error('Audio conversion error:', conversionError);
            return NextResponse.json(
                { error: `Audio conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}. Make sure ffmpeg is installed.` },
                { status: 500 }
            );
        }

        // Set up Azure Speech config
        const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechRecognitionLanguage = 'en-US';

        // Create pronunciation assessment config
        const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
            expectedText,
            sdk.PronunciationAssessmentGradingSystem.HundredMark,
            sdk.PronunciationAssessmentGranularity.Phoneme,
            true // Enable miscue
        );
        pronunciationConfig.enableProsodyAssessment = true;

        // Create audio stream from WAV buffer
        const pushStream = sdk.AudioInputStream.createPushStream(
            sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1) // 16kHz, 16-bit, mono
        );

        // Skip WAV header (44 bytes) and push raw PCM data
        const pcmData = wavBuffer.slice(44);
        pushStream.write(pcmData.buffer.slice(pcmData.byteOffset, pcmData.byteOffset + pcmData.byteLength));
        pushStream.close();

        const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        // Apply pronunciation assessment
        pronunciationConfig.applyTo(recognizer);

        // Perform recognition
        const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
            recognizer.recognizeOnceAsync(
                (result) => {
                    recognizer.close();
                    resolve(result);
                },
                (error) => {
                    recognizer.close();
                    reject(error);
                }
            );
        });

        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
            const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);

            // Extract word-level results with phonemes
            const words: Array<{
                word: string;
                accuracyScore: number;
                errorType: string;
                phonemes: Array<{ phoneme: string; score: number }>;
            }> = [];

            // Parse the JSON result for detailed phoneme data
            const jsonResult = result.properties.getProperty(
                sdk.PropertyId.SpeechServiceResponse_JsonResult
            );

            let detailedResult: {
                NBest?: Array<{
                    Words?: Array<{
                        Word: string;
                        PronunciationAssessment?: {
                            AccuracyScore: number;
                            ErrorType: string;
                        };
                        Phonemes?: Array<{
                            Phoneme: string;
                            PronunciationAssessment?: { AccuracyScore: number };
                        }>;
                    }>;
                }>;
            } = {};

            try {
                detailedResult = JSON.parse(jsonResult);
            } catch {
                // Fallback if JSON parsing fails
            }

            const nBest = detailedResult?.NBest?.[0];
            if (nBest?.Words) {
                for (const wordData of nBest.Words) {
                    words.push({
                        word: wordData.Word,
                        accuracyScore: wordData.PronunciationAssessment?.AccuracyScore ?? 0,
                        errorType: wordData.PronunciationAssessment?.ErrorType ?? 'None',
                        phonemes: (wordData.Phonemes ?? []).map((p) => ({
                            phoneme: p.Phoneme,
                            score: p.PronunciationAssessment?.AccuracyScore ?? 0,
                        })),
                    });
                }
            }

            // Generate feedback
            const pronounScore = pronunciationResult.pronunciationScore;
            let feedback = '';
            if (pronounScore >= 90) {
                feedback = 'Excellent! Your pronunciation is very clear and accurate.';
            } else if (pronounScore >= 75) {
                feedback = 'Good pronunciation! Focus on the highlighted phonemes for improvement.';
            } else if (pronounScore >= 50) {
                feedback = 'Keep practicing. Pay attention to the red-highlighted sounds.';
            } else {
                feedback = 'Try speaking more slowly and clearly. Listen to native pronunciation for reference.';
            }

            // Add specific phoneme advice
            const weakPhonemes = words
                .flatMap(w => w.phonemes)
                .filter(p => p.score < 60)
                .map(p => p.phoneme);

            if (weakPhonemes.length > 0) {
                const uniqueWeak = [...new Set(weakPhonemes)].slice(0, 3);
                feedback += ` Focus on: ${uniqueWeak.map(p => `/${p}/`).join(', ')}`;
            }

            // Save to database
            let runId = randomUUID();
            try {
                const supabase = createServerClient();
                const { data, error } = await supabase
                    .from('pronunciation_runs')
                    .insert({
                        id: runId,
                        sentence_id: sentenceId,
                        expected_text: expectedText,
                        asr_text: result.text || '',
                        score: Math.round(pronounScore),
                        diffs: words,
                        feedback,
                        device_info: {
                            mode: 'phoneme',
                            userAgent: request.headers.get('user-agent') || 'unknown',
                        },
                    })
                    .select()
                    .single();

                if (data) runId = data.id;
                if (error) console.error('DB save error:', error);
            } catch (dbError) {
                console.error('Database error:', dbError);
            }

            return NextResponse.json({
                runId,
                accuracyScore: pronunciationResult.accuracyScore,
                fluencyScore: pronunciationResult.fluencyScore,
                completenessScore: pronunciationResult.completenessScore,
                pronunciationScore: pronounScore,
                words,
                expectedText,
                recognizedText: result.text || '',
                feedback,
                createdAt: new Date().toISOString(),
            });
        } else if (result.reason === sdk.ResultReason.NoMatch) {
            return NextResponse.json(
                { error: 'No speech could be recognized. Please speak clearly into the microphone.' },
                { status: 400 }
            );
        } else {
            return NextResponse.json(
                { error: `Speech recognition failed: ${result.errorDetails || 'Unknown error'}` },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Phoneme evaluate error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}
