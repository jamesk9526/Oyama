# Chat Features Quick Reference

**Version:** 1.0  
**Last Updated:** January 18, 2026

---

## User Features

### Sending Messages
1. **Type in chat box** - Input stays focused automatically
2. **Press Enter** or **click Send button** - Message appears with timestamp
3. **Input auto-focuses** - Ready for next message immediately
4. **Agent selection** (optional) - Chat uses agent's system prompt if selected
5. **Model selection** (required) - Choose Ollama model from settings

### Viewing Messages

#### Assistant Messages (Markdown-supported)
- **Bold text:** `**bold**` or `__bold__`
- **Italic text:** `*italic*` or `_italic_`
- **Code blocks:** Syntax highlighted, language auto-detected
  - Copy button in top-right corner
  - Click "Copy" to copy entire block
  - Language label shows in header
- **Inline code:** ``single backticks`` shown in red
- **Lists:** Both ordered and unordered, properly nested
- **Tables:** Full markdown table support, responsive on mobile
- **Blockquotes:** Left-bordered quoted text
- **Links:** Click to open in new tab
- **Strikethrough:** `~~strikethrough~~` text
- **Math:** LaTeX supported (both inline and block)

#### User Messages
- Plain text (no markdown parsing)
- Preserves whitespace and line breaks
- Shows timestamp

### Chat Interface
- **Auto-scroll:** Automatically scrolls to latest message with smooth animation
- **Streaming:** See responses appear in real-time, character by character
- **Loading indicator:** Shows "Streaming response..." while waiting
- **Error messages:** Red banner if something goes wrong
- **Timestamps:** All messages show sent time

---

## Chat Settings

### Per-Chat Settings
**Agent Selection (Optional)**
- Dropdown in header
- Select specific agent for their system prompt
- Leave blank to use global system prompt

**Model Selection (Required)**
- Choose from available Ollama models
- Must select before chatting
- Loads from Settings → Providers

### Global Settings (Settings Page)

**Workspace Tab:**
- System Name: How the AI refers to itself
- User Name: How the AI refers to you
- System Personalization: Run setup wizard

**Providers Tab:**
- Ollama URL: Usually `http://localhost:11434`
- Available Models: Auto-loads from Ollama
- Connection Test: Verify Ollama is running

**LLM Tab:**
- Temperature: 0.0 (precise) to 2.0 (creative)
- Top-P: 0.0 to 1.0 (diversity control)
- Max Tokens: Response length limit

**Prompts Tab:**
- Global System Prompt: Fallback for chats without agent

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Send message |
| Shift+Enter | New line in message (if implemented) |
| Ctrl+A | Select all text in input |
| Tab | Move to next field |

---

## Code Block Features

### View Code
- Syntax highlighting applied automatically
- Language detected from code fence
- Horizontal scroll for long lines
- Dark theme (atom-one-dark)

### Copy Code
1. Click "Copy" button in top-right corner
2. Button shows "Copied!" for 2 seconds
3. Code in clipboard, ready to paste

### Supported Languages
100+ languages including:
- JavaScript, TypeScript, Python, Java, C++, C#, Rust
- HTML, CSS, SQL, Shell, PowerShell
- Go, Ruby, PHP, Swift, Kotlin
- And many more...

---

## Message Formatting Examples

### Bold and Italic
```
**bold text**
*italic text*
***bold and italic***
```

### Code Blocks
````
```python
def greet(name):
    return f"Hello, {name}!"
```
````

### Lists
```
- Bullet point 1
- Bullet point 2
  - Nested point
  
1. Numbered point 1
2. Numbered point 2
```

### Tables
```
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Blockquotes
```
> This is a quote
> that spans multiple lines
```

### Links
```
[Link text](https://example.com)
![Image alt text](image.jpg)
```

---

## Troubleshooting

### "No model selected" Error
**Solution:** Go to Settings → Providers, verify Ollama connection, select a model

### Connection Failed
**Solution:** 
1. Check Ollama is running: `ollama serve`
2. Verify URL in Settings (default: `http://localhost:11434`)
3. Click "Test Connection" button in Settings

### Messages Not Streaming
**Solution:**
1. Ensure `stream: true` in API request
2. Check browser console for errors
3. Verify Ollama API responding with streaming data

### Input Loses Focus
**Solution:** This should not happen - report as bug with browser version

### Markdown Not Rendering
**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Refresh page (Ctrl+R)
3. Check console for JavaScript errors

### Code Copy Not Working
**Solution:**
1. Browser clipboard permissions might be blocked
2. Check browser settings for site permissions
3. Use manual selection + Ctrl+C as fallback

---

## Performance Tips

### For Better Performance
1. **Clear chat history** if experiencing slowdowns with 1000+ messages
2. **Close other tabs** to free up memory
3. **Use shorter messages** for faster streaming
4. **Pick smaller models** (7B better than 70B) for speed

### Mobile Optimization
1. **Portrait mode** is optimal for chat
2. **Keyboard auto-opens** with input focus
3. **Pull-to-refresh** clears conversation
4. **Long press** on message for copy options (if implemented)

---

## Assistant Capabilities

### What This AI Can Do
- ✅ Answer questions on almost any topic
- ✅ Write and explain code
- ✅ Translate between languages
- ✅ Summarize content
- ✅ Help with writing and editing
- ✅ Mathematical calculations and explanations
- ✅ Creative writing and brainstorming
- ✅ And much more!

### Limitations
- ❌ Real-time internet access (depends on model)
- ❌ Cannot access files on your computer
- ❌ Training data has a cutoff date (depends on model)
- ❌ No memory between separate conversations
- ❌ Cannot execute code directly

---

## Privacy & Security

✅ **Local Processing:** Chats stay on your machine (when using Ollama)
✅ **No Cloud Upload:** Messages never sent to external servers (with Ollama)
✅ **You Control Data:** Delete conversations anytime
✅ **Open Source:** Model transparency with Ollama

---

## Advanced Features (Coming Soon)

- 🔄 Regenerate response button
- ⏹️ Stop generation during streaming
- 💾 Message persistence/history
- 🔄 Message editing
- 📌 Pin important messages
- 🔍 Search message history
- 📤 Export conversations
- 🤖 Code execution sandbox

---

## Keyboard Navigation

| Key | Function |
|-----|----------|
| Tab | Navigate to next element |
| Shift+Tab | Navigate to previous element |
| Enter | Send message (in input) |
| Space | Toggle button (with focus) |
| Escape | Close any open menus/dropdowns |

---

## Tips & Tricks

1. **Multi-line Messages:** Paste code or long text directly
2. **Agent Switching:** Change agent before each message for variety
3. **Model Testing:** Try different models to find your favorite
4. **System Prompt:** Edit in Settings for consistent behavior
5. **Clear History:** Pull-to-refresh on mobile, or see clear option (coming soon)

---

## Stats & Metrics

- **Max Message Length:** Depends on model (typically 1000+ chars fine)
- **Response Time:** Usually 5-30 seconds (depends on model)
- **Chat History:** Loaded in memory until page refresh
- **Browser Compatibility:** Chrome, Firefox, Safari, Electron
- **Mobile Support:** iOS Safari, Android Chrome, etc.

---

**Questions?** Check the settings page or look at this guide!
