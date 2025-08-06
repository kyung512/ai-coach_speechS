import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; 
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Get the current directory name in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Loading environment variables...');
dotenv.config();

console.log('🔍 Creating Express app...');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔍 Initializing Google Cloud TTS client...');
let gcloudTtsClient = null;
try {
  gcloudTtsClient = new TextToSpeechClient();
  console.log('✅ Google Cloud TTS client initialized');
} catch (error) {
  console.warn('⚠️ Google Cloud TTS client initialization failed:', error.message);
}

console.log('🔍 Setting up middleware...');
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

console.log('🔍 Setting up routes...');

// Debug route
console.log('🔍 Adding /api/debug route...');
app.get('/api/debug', (req, res) => {
  const distPath = path.join(__dirname, '../dist');
  const indexPath = path.join(distPath, 'index.html');
  const viteSvgPath = path.join(distPath, 'vite.svg');
  
  try {
    const distExists = fs.existsSync(distPath);
    const files = distExists ? fs.readdirSync(distPath) : [];
    
    res.json({
      server: {
        __dirname,
        distPath,
        distExists,
        indexHtmlExists: fs.existsSync(indexPath),
        viteSvgExists: fs.existsSync(viteSvgPath),
        files
      },
      environment: {
        PORT,
        hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
        hasElevenLabsVoiceId: !!process.env.ELEVENLABS_VOICE_ID,
        hasGeminiApiUrl: !!process.env.GEMINI_API_URL,
        hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
        hasGcloudVoiceName: !!process.env.GCLOUD_TTS_VOICE_NAME,
        gcloudClientReady: !!gcloudTtsClient
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
console.log('🔍 Adding /api/health route...');
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    nodeVersion: process.version
  });
});

// ElevenLabs TTS
console.log('🔍 Adding /api/elevenlabs-tts-proxy route...');
app.post('/api/elevenlabs-tts-proxy', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
      console.error('Eleven Labs API Key or Voice ID not configured on server.');
      return res.status(500).json({
        error: 'Server configuration error: ElevenLabs TTS service not available.',
      });
    }

    console.log('Making ElevenLabs TTS request...');
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.4, similarity_boost: 0.8 },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('Eleven Labs API error:', elevenLabsResponse.status, errorText);
      return res.status(elevenLabsResponse.status).json({ 
        error: `Eleven Labs API error: ${errorText}` 
      });
    }

    res.setHeader(
      'Content-Type',
      elevenLabsResponse.headers.get('Content-Type') || 'audio/mpeg'
    );
    elevenLabsResponse.body.pipe(res);

  } catch (error) {
    console.error('Error in Eleven Labs TTS proxy:', error);
    res.status(500).json({ 
      error: 'Internal server error during TTS generation.',
      details: error.message 
    });
  }
});

// Google Cloud TTS
console.log('🔍 Adding /api/gcloud-tts-proxy route...');
app.post('/api/gcloud-tts-proxy', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!gcloudTtsClient) {
      return res.status(500).json({ 
        error: 'Google Cloud TTS client not initialized' 
      });
    }

    const GCLOUD_TTS_VOICE_NAME = process.env.GCLOUD_TTS_VOICE_NAME;
    const GCLOUD_TTS_AUDIO_ENCODING = process.env.GCLOUD_TTS_AUDIO_ENCODING || 'MP3';
    const GCLOUD_TTS_SAMPLE_RATE_HERTZ = parseInt(process.env.GCLOUD_TTS_SAMPLE_RATE_HERTZ || '16000', 10);

    if (!GCLOUD_TTS_VOICE_NAME) {
      console.error('Google Cloud TTS Voice Name not configured on server.');
      return res.status(500).json({ 
        error: 'Server configuration error: GCloud TTS not available.' 
      });
    }

    console.log('Making Google Cloud TTS request...');
    const request = {
      input: { text: text },
      voice: { 
        languageCode: GCLOUD_TTS_VOICE_NAME.substring(0, 5), 
        name: GCLOUD_TTS_VOICE_NAME 
      },
      audioConfig: {
        audioEncoding: GCLOUD_TTS_AUDIO_ENCODING,
        sampleRateHertz: GCLOUD_TTS_SAMPLE_RATE_HERTZ,
      },
    };

    const [response] = await gcloudTtsClient.synthesizeSpeech(request);

    let contentType;
    switch (GCLOUD_TTS_AUDIO_ENCODING) {
      case 'MP3':
        contentType = 'audio/mpeg';
        break;
      case 'OGG_OPUS':
        contentType = 'audio/ogg';
        break;
      case 'LINEAR16':
        contentType = 'audio/wav';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    res.setHeader('Content-Type', contentType);
    res.send(response.audioContent);

  } catch (error) {
    console.error('Error in Google Cloud TTS proxy:', error);
    res.status(500).json({ 
      error: 'Internal server error during GCloud TTS generation.',
      details: error.message 
    });
  }
});

// Chat endpoint
console.log('🔍 Adding /api/chat route...');
app.post('/api/chat', async (req, res) => {
  try {
    const { systemInstruction, contents, generationConfig } = req.body;
    
    if (!contents) {
      return res.status(400).json({ error: 'Contents are required' });
    }

    const GEMINI_API_URL = process.env.GEMINI_API_URL;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_URL || !GEMINI_API_KEY) {
      console.error('Gemini API URL or Key not configured on server.');
      return res.status(500).json({ 
        error: 'Server configuration error: Gemini service not available.' 
      });
    }

    console.log('Making Gemini chat request...');
    const geminiPayload = {
      systemInstruction: systemInstruction,
      contents: contents,
      generationConfig: generationConfig,
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API chat error:', geminiResponse.status, errorText);
      return res.status(geminiResponse.status).json({ 
        error: `Gemini API chat error: ${errorText}` 
      });
    }

    const geminiResult = await geminiResponse.json();
    res.json(geminiResult);

  } catch (error) {
    console.error('Error in Gemini chat proxy:', error);
    res.status(500).json({ 
      error: 'Internal server error during Gemini chat generation.',
      details: error.message 
    });
  }
});

// Summarize endpoint
console.log('🔍 Adding /api/summarize route...');
app.post('/api/summarize', async (req, res) => {
  try {
    const { contents, generationConfig } = req.body;
    
    if (!contents) {
      return res.status(400).json({ error: 'Contents are required' });
    }

    const GEMINI_API_URL = process.env.GEMINI_API_URL;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_URL || !GEMINI_API_KEY) {
      console.error('Gemini API URL or Key not configured on server.');
      return res.status(500).json({ 
        error: 'Server configuration error: Gemini service not available.' 
      });
    }

    console.log('Making Gemini summarize request...');
    const geminiPayload = {
      contents: contents,
      generationConfig: generationConfig,
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API summarize error:', geminiResponse.status, errorText);
      return res.status(geminiResponse.status).json({ 
        error: `Gemini API summarize error: ${errorText}` 
      });
    }

    const geminiResult = await geminiResponse.json();
    res.json(geminiResult);

  } catch (error) {
    console.error('Error in Gemini summarizer proxy:', error);
    res.status(500).json({ 
      error: 'Internal server error during Gemini summarization.',
      details: error.message 
    });
  }
});

// IMPORTANT: Add the fallback route LAST using a different approach
console.log('🔍 Adding SPA fallback route (using alternative method)...');
try {
  // Alternative 1: Use a more specific pattern instead of *
  app.use((req, res, next) => {
    // Skip if it's an API route
    if (req.path.startsWith('/api/')) {
      return next();
    }
    
    // Skip if it's a static file that exists
    const staticFilePath = path.join(__dirname, '..', 'dist', req.path);
    if (fs.existsSync(staticFilePath) && fs.statSync(staticFilePath).isFile()) {
      return next();
    }
    
    // Serve index.html for SPA routes
    console.log(`🔍 SPA fallback triggered for: ${req.path}`);
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      console.log(`✅ Serving index.html for: ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.error(`❌ index.html not found at: ${indexPath}`);
      res.status(404).json({
        error: 'Frontend not found',
        message: 'Please run "npm run build" to generate the dist folder',
        indexPath,
        suggestion: 'From project root: npm run build'
      });
    }
  });
  console.log('✅ SPA fallback route added successfully using middleware approach');
} catch (error) {
  console.error('❌ Error adding SPA fallback route:', error);
}

// Catch-all route to serve the index.html for client-side routing
// app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../dist', 'index.html'));
// });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
console.log('🔍 Starting server...');
try {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, '..', 'dist')}`);
    
    // Startup checks
    const distPath = path.join(__dirname, '..', 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const viteSvgPath = path.join(distPath, 'vite.svg');
    
    if (fs.existsSync(distPath)) {
      console.log('✅ dist/ folder found');
      if (fs.existsSync(indexPath)) {
        console.log('✅ index.html found');
      } else {
        console.log('❌ index.html NOT found in dist/');
      }
      if (fs.existsSync(viteSvgPath)) {
        console.log('✅ vite.svg found (favicon should work)');
      } else {
        console.log('⚠️ vite.svg not found (favicon may not work)');
      }
    } else {
      console.log('❌ dist/ folder NOT found');
      console.log('💡 Run "npm run build" from project root to create it');
    }
    
    console.log('\n🔗 Test these endpoints:');
    console.log(`   http://localhost:${PORT}/api/health`);
    console.log(`   http://localhost:${PORT}/api/debug`);
    console.log(`   http://localhost:${PORT}/vite.svg`);
    console.log(`   http://localhost:${PORT}/`);
  });
} catch (error) {
  console.error('❌ Failed to start server:', error);
}