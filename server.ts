import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client lazily or if key exists
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Ensure the server responds to JSON request payloads properly.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * API: Generate highly realistic synthetic emails using Gemini
 */
app.post('/api/generate-test-email', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { label, scenario } = req.body;
    
    if (!label || (label !== 'phishing' && label !== 'safe')) {
      res.status(400).json({ error: 'Valid label (phishing or safe) is required.' });
      return;
    }

    const ai = getAIClient();
    
    const prompt = `Generate a realistic email which would be classified as "${label}".
     Scenario or Theme context: "${scenario || 'any common topic (payment, workplace, social media, order, personal)'}".
     
     If label is "phishing", include typical phishing traits: urgent phrasing, mismatched/suspicious sender address, a URL that looks official but has fake indicators or a weird TLD, and pressure tactics.
     If label is "safe", make it a clean, harmless email (such as a calendar update, standard receipt, routine work newsletter, or friendly invite), with a legitimate-looking sender address and no malicious request or threat.
     
     Return the output in structured JSON format matching the schema requested. Keep the email bodies concise (2-4 sentences max) but realistic.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a professional cybersecurity training assistant specializing in educational email safety and simulation of phishing campaigns.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['subject', 'sender', 'body', 'label', 'explanation', 'scenarioType'],
          properties: {
            subject: {
              type: Type.STRING,
              description: 'The email subject line.'
            },
            sender: {
              type: Type.STRING,
              description: 'A realistic matching email sender address (e.g. security-paypal@secure-verify-update.com or coworker@office-space.com).'
            },
            body: {
              type: Type.STRING,
              description: 'The email main message text (2-4 sentences, realistic formatting).'
            },
            label: {
              type: Type.STRING,
              description: 'Must match exactly the requested string label: "phishing" or "safe".'
            },
            explanation: {
              type: Type.STRING,
              description: 'A brief 1-2 sentence explanation of typical green or red flags shown in this email (e.g., mismatched domain, pressure tactic, or purely informational layout).'
            },
            scenarioType: {
              type: Type.STRING,
              description: 'A brief term describing the attack vector or type (e.g., Spear Phishing, Automated Receipt, Office News, Technical Alert).'
            }
          }
        }
      }
    });

    const jsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error('Error generating email with Gemini:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate content',
      noApiKey: !process.env.GEMINI_API_KEY
    });
  }
});

/**
 * API: Deep Cybersecurity Auditing Advice by Gemini based on model scores and features
 */
app.post('/api/explain-model-decision', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { email, prediction, triggeredKeywords } = req.body;

    if (!email || !prediction) {
      res.status(400).json({ error: 'Email and Prediction data are required.' });
      return;
    }

    const ai = getAIClient();

    const analysisPrompt = `
      Please act as a Chief Information Security Officer (CISO) and evaluate this email and our machine learning model's prediction:
      
      EMAIL DETAIL:
      - Subject: "${email.subject}"
      - Sender: "${email.sender}"
      - Body: "${email.body}"
      
      ML MODEL DETECTED:
      - Prediction Label: "${prediction.isPhishing ? 'Phishing' : 'Safe'}"
      - Phishing Probability: ${(prediction.probability * 100).toFixed(1)}%
      - Triggered Trigger Words: ${JSON.stringify(triggeredKeywords || [])}
      - Core Rules Triggered: ${JSON.stringify(prediction.features || {})}

      Provide a professional, clear audit output in Markdown explaining:
      1. Red Flags & Analysis: What social engineering tricks or sender flags are present (urgency, authority, subversion).
      2. Security Advice: Practical tips a real human should use if they saw this email in their inbox (e.g. out-of-channel verification, hovered links).
      3. ML Alignment: Briefly comment whether the ML score makes sense based on the structural content. Keep your audit highly concise (approx. 150-200 words), engaging, and educational!
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: analysisPrompt,
      config: {
        systemInstruction: 'You are a helpful Security Analyst giving clean, modern, actionable guidance without generic preamble or dry repetitive logs.'
      }
    });

    res.json({ success: true, explanation: response.text });

  } catch (error: any) {
    console.error('Error explaining decision with Gemini:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to explain decision',
      noApiKey: !process.env.GEMINI_API_KEY
    });
  }
});

// Setup Vite Dev Server / Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development server connected in middleware mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static handler configured.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phishing Scanner Server active over Express running on port ${PORT}`);
  });
}

startServer();
