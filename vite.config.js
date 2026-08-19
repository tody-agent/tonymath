import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Vite Dev Server Plugin: /api/tts endpoint
 * Calls Microsoft Edge Neural TTS (vi-VN-HoaiMyNeural / vi-VN-NamMinhNeural)
 * to stream studio-quality Vietnamese speech in real-time.
 */
function edgeTtsDevPlugin() {
  return {
    name: 'vite-plugin-edge-tts-dev',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          const text = url.searchParams.get('text');
          const voice = url.searchParams.get('voice') || 'vi-VN-HoaiMyNeural';

          if (!text || !text.trim()) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Text query parameter is required' }));
            return;
          }

          const tmpFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
          
          execFile('uvx', ['edge-tts', '--voice', voice, '--text', text, '--write-media', tmpFile], (error) => {
            if (error || !fs.existsSync(tmpFile)) {
              console.error('Edge TTS generation error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'TTS synthesis failed' }));
              return;
            }

            try {
              const audioBuffer = fs.readFileSync(tmpFile);
              fs.unlinkSync(tmpFile);

              res.setHeader('Content-Type', 'audio/mpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Content-Length', audioBuffer.length);
              res.end(audioBuffer);
            } catch (readErr) {
              console.error('Error reading TTS audio file:', readErr);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to read audio output' }));
            }
          });
        } catch (err) {
          console.error('Error in /api/tts middleware:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), edgeTtsDevPlugin()],
});
