import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { initFirebase } from '../lib/firebase.js';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const InputSchema = z.object({
  prompt: z.string().min(1, 'prompt is required'),
  tags: z.array(z.string()).optional().default([]),
  createdBy: z.string().optional().default('agent'),
  width: z.number().int().positive().optional().default(1024),
  height: z.number().int().positive().optional().default(1024),
  projectId: z.string().min(1),
});

type GenerateImageInput = z.infer<typeof InputSchema>;

export async function generateImage(rawInput: unknown): Promise<CallToolResult> {
  const input = InputSchema.parse(rawInput) as GenerateImageInput;

  initFirebase();

  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY env var is required');

  const ai = new GoogleGenAI({ apiKey });

  // Generate image using Imagen 3
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: input.prompt,
    config: {
      numberOfImages: 1,
    },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) {
    throw new Error('No image data returned from Imagen 3');
  }

  const imageBuffer = Buffer.from(imageBytes, 'base64');
  const mimeType = 'image/png';
  const ext = 'png';

  // Upload to Firebase Storage
  const uuid = randomUUID();
  const storagePath = `generated/${input.projectId}/${uuid}.${ext}`;
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath);

  await file.save(imageBuffer, {
    metadata: { contentType: mimeType },
  });

  await file.makePublic();
  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  // Write to Firestore
  const db = getFirestore();
  const docRef = await db.collection('generatedImages').add({
    url,
    storagePath,
    prompt: input.prompt,
    createdAt: FieldValue.serverTimestamp(),
    projectId: input.projectId,
    createdBy: input.createdBy,
    tags: input.tags,
    width: input.width,
    height: input.height,
    model: 'imagen-3.0-generate-002',
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ url, storagePath, docId: docRef.id }, null, 2),
    }],
  };
}
