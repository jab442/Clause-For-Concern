# Streaming AI Implementation

This extension now uses server-side streaming instead of direct OpenAI API calls from the browser. This approach provides:

- **Faster response times**: Text appears as it's generated, not all at once
- **Better security**: API keys stay on the server, not in the extension
- **More flexibility**: Easy to switch between different AI providers
- **Lower latency**: Immediate feedback instead of waiting for complete responses

## How It Works

1. **User clicks AI button** → Extension sends request to server
2. **Server processes request** → Calls AI API with streaming enabled
3. **Response streams back** → Text appears in real-time as it's generated
4. **Storage updates continuously** → UI updates instantly with each chunk

## Setup Instructions

### 1. Server Setup

You need to set up a server that implements the streaming endpoint. See `server-example.js` for a complete example.

**Quick start:**
```bash
# Install dependencies
npm install express cors

# Set your API key (if using OpenAI)
export OPENAI_API_KEY=your_key_here

# Run the server
node server-example.js
```

### 2. Update Extension Configuration

In `src/scripts/background.ts`, update the server endpoint:

```typescript
const SERVER_ENDPOINT = 'https://your-server.com/api/scan';
// Or for local development:
// const SERVER_ENDPOINT = 'http://localhost:3000/api/scan';
```

### 3. Deploy Your Server

Deploy to any hosting service that supports Node.js:
- **Vercel**: `vercel deploy`
- **Railway**: `railway up`
- **Heroku**: `git push heroku main`
- **DigitalOcean App Platform**
- **AWS Lambda** (with streaming response support)

## Server Requirements

Your server endpoint must:
- Accept POST requests at `/api/scan`
- Receive JSON body: `{ text: string, domain: string }`
- Set headers for streaming:
  ```javascript
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  ```
- Stream response chunks as they're generated
- Support CORS for extension origin

## Alternative: Using Readability

For even better performance, you can use Mozilla's Readability library to extract clean text from web pages before sending to the server:

```javascript
// In content script
import { Readability } from '@mozilla/readability';

const documentClone = document.cloneNode(true);
const article = new Readability(documentClone).parse();
const cleanText = article.textContent; // Clean, relevant text only

// Send to server
fetch(SERVER_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({ text: cleanText, domain: window.location.hostname })
});
```

## Security Notes

- Never commit API keys to the repository
- Use environment variables on the server
- Implement rate limiting on your server
- Consider adding authentication if needed
- Use HTTPS in production

## Troubleshooting

**Stream not working?**
- Check server logs for errors
- Verify CORS headers are set correctly
- Ensure `Transfer-Encoding: chunked` is set
- Test the endpoint with curl: `curl -N http://localhost:3000/api/scan -d '{"text":"test"}'`

**Slow responses?**
- Check your server's network connection
- Consider using a faster AI model
- Implement caching for repeated queries
- Use a CDN for server endpoints

## Development vs Production

**Development:**
```typescript
const SERVER_ENDPOINT = 'http://localhost:3000/api/scan';
```

**Production:**
```typescript
const SERVER_ENDPOINT = 'https://api.yourdomain.com/api/scan';
```

## Changes Made

- ✅ Removed OpenAI API key requirement from extension
- ✅ Implemented streaming response handling in background.ts
- ✅ Updated popup.ts to work without API keys
- ✅ Added real-time UI updates as text streams in
- ✅ Maintained backward compatibility with existing features
- ✅ Kept error handling and notifications

## Files Modified

- `src/scripts/background.ts` - Streaming implementation
- `src/scripts/views/popup.ts` - Removed API key requirement
- `src/scripts/api.ts` - Deprecated, no longer needed

## Next Steps

1. Set up your streaming server
2. Update `SERVER_ENDPOINT` in background.ts
3. Test locally with your server
4. Deploy server to production
5. Update extension with production endpoint
6. (Optional) Remove OpenAI settings from settings page if no longer needed
