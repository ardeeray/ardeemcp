import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateImage } from './generate-image.js';

const GenerateImageSchema = {
  prompt: z.string().min(1).describe('Text description of the image to generate'),
  tags: z.array(z.string()).optional().describe('Optional tags for categorisation'),
  createdBy: z.string().optional().describe('Identifier for who or what requested this image (e.g. "copilot", "admin")'),
  width: z.number().int().positive().optional().describe('Image width in pixels (default: 1024)'),
  height: z.number().int().positive().optional().describe('Image height in pixels (default: 1024)'),
};

export function registerTools(server: McpServer, projectId: string): void {
  server.registerTool(
    'generate_image',
    {
      description: 'Generate an image with Imagen 3, upload it to Firebase Storage, and persist the metadata to Firestore. Returns the public download URL, storage path, and Firestore document ID.',
      inputSchema: GenerateImageSchema,
    },
    async (input) => {
      return generateImage({ ...input, projectId });
    }
  );
}
