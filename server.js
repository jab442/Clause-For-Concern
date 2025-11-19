// Minimal server for AI streaming - Install: npm install express cors
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/scan', (req, res) => {
    const { text, domain } = req.body;
    console.log('📥 Request received:', { text: text?.substring(0, 50), domain });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Mock response - replace with actual AI call
    const response = `<h4>AI Analysis for ${domain}</h4><p>The AI feature requires configuration. To use a real AI:</p><ul><li>Add OpenAI API call here with streaming</li><li>Or use local AI like Ollama</li></ul>`;
    
    const words = response.split(' ');
    let i = 0;
    const interval = setInterval(() => {
        if (i >= words.length) { clearInterval(interval); res.end(); return; }
        res.write(words[i++] + ' ');
    }, 50);
});

app.listen(3000, () => console.log('Server: http://localhost:3000'));
