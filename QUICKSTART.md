# Quick Start Guide - Server Streaming Setup

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Fix the Current Error ✅

The error you're seeing is because:
- ❌ URL was `https://localhost:3000/api/scan` (wrong)
- ✅ URL is now `http://localhost:3000/api/scan` (correct)

### Step 2: Start Your Local Server

**Option A: Use the Example Server**

1. Install dependencies:
```bash
npm install express cors
```

2. Create a simple test server:
```bash
# Use the provided server-example.js
node server-example.js
```

**Option B: Quick Test Server (No AI)**

Create `test-server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/scan', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  // Simulate streaming
  const message = 'This is a test response. ';
  const words = message.split(' ');
  
  let i = 0;
  const interval = setInterval(() => {
    if (i >= words.length) {
      clearInterval(interval);
      res.end();
      return;
    }
    res.write(words[i] + ' ');
    i++;
  }, 200); // Send a word every 200ms
});

app.listen(3000, () => {
  console.log('✅ Test server running on http://localhost:3000');
});
```

Run it:
```bash
node test-server.js
```

### Step 3: Test the Server

```bash
# Test that it works
curl -N http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"text":"test","domain":"google.com"}'
```

You should see text appearing word by word!

### Step 4: Rebuild and Reload Extension

```bash
# If using TypeScript
npm run build

# Then go to chrome://extensions
# Click the reload button on your extension
```

### Step 5: Test the Extension

1. Click the extension icon
2. Click the AI button
3. You should see "This is a test response." appearing word by word!

---

## 🔧 Connecting to Real AI

### Using OpenAI (Recommended)

Update your server to call OpenAI:

```javascript
app.post('/api/scan', async (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: "system", content: "Format your response as HTML." },
        { role: "user", content: req.body.text }
      ],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim() !== '');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content || '';
          if (content) {
            res.write(content);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }

  res.end();
});
```

Set your API key:
```bash
export OPENAI_API_KEY=your_key_here
node server-example.js
```

### Using Local AI (Ollama)

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. Update server to use Ollama (see `server-example.js`)

---

## 🌐 Deploying to Production

### Option 1: Vercel (Easiest)

1. Create `api/scan.js` in your project:
```javascript
export default async function handler(req, res) {
  // ... streaming code
}
```

2. Deploy:
```bash
vercel
```

3. Update extension:
```typescript
const SERVER_ENDPOINT = 'https://your-project.vercel.app/api/scan';
```

### Option 2: Railway

```bash
railway init
railway up
```

### Option 3: Any Node.js Host

Deploy to: Heroku, DigitalOcean, AWS, etc.

---

## ✅ Checklist

- [ ] Server is running (`node test-server.js` or `node server-example.js`)
- [ ] Server responds to curl test
- [ ] Extension manifest has `host_permissions`
- [ ] Extension rebuilt (`npm run build`)
- [ ] Extension reloaded in Chrome
- [ ] Click AI button and see streaming response

---

## 🆘 Still Not Working?

1. **Check background script console:**
   - Go to `chrome://extensions`
   - Find your extension
   - Click "service worker"
   - Look for errors

2. **Check server logs:**
   - Look at terminal where server is running
   - See if requests are coming through

3. **Verify URL:**
   - In `background.ts`: `http://localhost:3000/api/scan`
   - NOT `https://` for localhost!

4. **Check manifest permissions:**
   - Open `src/manifest.json`
   - Verify `host_permissions` includes localhost

5. **See TROUBLESHOOTING.md** for more help

---

## 📚 Files Changed

- ✅ `src/scripts/background.ts` - Streaming implementation
- ✅ `src/scripts/views/popup.ts` - No API key needed
- ✅ `src/manifest.json` - Added host_permissions
- ✅ `src/manifest-ff.json` - Added host_permissions

## 🎉 Success!

Once you see text streaming in, you're done! Now you can:
- Customize the AI prompt
- Switch AI providers
- Deploy to production
- Remove OpenAI settings from the extension if desired
