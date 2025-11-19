/**
 * Example Server Implementation for Streaming AI Responses
 * 
 * This is a sample server that demonstrates how to implement streaming
 * responses for the ToS;DR Chrome extension.
 * 
 * You can use this with Express.js, Fastify, or any other Node.js framework.
 */

// Example using Express.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

/**
 * Streaming endpoint that the extension will call
 * POST /api/scan
 * Body: { text: string, domain: string }
 */
app.post('/api/scan', async (req, res) => {
    const { text, domain } = req.body;
    
    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    
    try {
        // Example: Call your AI service (OpenAI, Claude, etc.)
        // with streaming enabled
        
        // Option 1: OpenAI API with streaming
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: "system",
                        content: "Format your response as clean HTML with proper paragraph tags (<p>), headers (<h4>, <h5>), and lists (<ul>, <li>) for better readability. Do not include <html>, <head>, or <body> tags - just the content markup."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.5,
                stream: true  // Enable streaming
            })
        });
        
        // Stream the response back to the client
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            
            // Parse SSE format from OpenAI
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        if (content) {
                            // Send the content chunk to the extension
                            res.write(content);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        
        res.end();
        
    } catch (error) {
        console.error('Error:', error);
        res.write(`Error: ${error.message}`);
        res.end();
    }
});

/**
 * Alternative implementation using a local AI model
 * (e.g., Ollama, llama.cpp, etc.)
 */
app.post('/api/scan-local', async (req, res) => {
    const { text, domain } = req.body;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    try {
        // Example: Using Ollama
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama2',
                prompt: text,
                stream: true
            })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.response) {
                            res.write(parsed.response);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
        
        res.end();
        
    } catch (error) {
        console.error('Error:', error);
        res.write(`Error: ${error.message}`);
        res.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Streaming endpoint: http://localhost:${PORT}/api/scan`);
});

/**
 * To use this server:
 * 
 * 1. Install dependencies:
 *    npm install express cors
 * 
 * 2. Set your OpenAI API key (if using OpenAI):
 *    export OPENAI_API_KEY=your_api_key_here
 * 
 * 3. Update the SERVER_ENDPOINT in background.ts to point to your server:
 *    const SERVER_ENDPOINT = 'http://localhost:3000/api/scan';
 * 
 * 4. Run the server:
 *    node server-example.js
 * 
 * 5. Deploy to a hosting service (Vercel, Railway, Heroku, etc.) for production
 */
