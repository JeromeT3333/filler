# AutoDetect Template Filler - Vercel Hosted

A full-stack template filling application with Gemini Vision AI, hosted on Vercel with cloud storage.

## Features

- **Gemini Vision AI**: Intelligent field detection that understands text, images, signatures, icons, and checkboxes
- **Smart Text Merging**: Automatically merges adjacent text into single logical fields
- **Cloud Storage**: Images and templates stored in Vercel Blob (persistent, accessible anywhere)
- **Multi-Template Support**: Switch between multiple saved templates
- **Drag & Resize**: Visual field positioning with canvas handles
- **Spreadsheet Interface**: Excel import/export, per-row image uploads
- **Batch Rendering**: Generate all filled templates at once

## Deployment

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Get Required Tokens

**Gemini API Key:**
- Get from https://aistudio.google.com/app/apikey
- The key is already embedded in the frontend but you should use your own for production

**Vercel Blob Token:**
- Go to https://vercel.com/dashboard
- Navigate to your project → Storage → Create Blob Store
- Copy the `BLOB_READ_WRITE_TOKEN`

### 3. Deploy
```bash
cd template-filler-app
vercel --prod
```

### 4. Set Environment Variables
In Vercel Dashboard:
- `BLOB_READ_WRITE_TOKEN` = your blob token

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload image to Vercel Blob |
| `/api/detect` | POST | Gemini Vision field detection |
| `/api/save-template` | POST | Save template configuration |
| `/api/load-template` | GET | Load template configuration |
| `/api/list-templates` | GET | List all saved templates |

## How It Works

1. **Upload**: Images go to Vercel Blob storage (not localStorage - no size limits!)
2. **Detect**: Backend calls Gemini Vision API with the image URL
3. **Configure**: User selects fields, positions them, sets fonts
4. **Save**: Template config (fields + data) saved as JSON in Blob storage
5. **Switch**: Load any previously saved template from the cloud
6. **Render**: Canvas-based rendering with text and image compositing

## File Structure

```
template-filler-app/
├── api/
│   ├── upload.js          # Image upload to Vercel Blob
│   ├── detect.js          # Gemini Vision detection
│   ├── save-template.js   # Save template config
│   ├── load-template.js   # Load template config
│   └── list-templates.js  # List all templates
├── public/
│   └── index.html         # Complete frontend application
├── package.json
├── vercel.json
└── README.md
```

## Notes

- The app auto-detects if running on Vercel or locally
- Each template gets a unique ID based on timestamp + random string
- Template images are stored in `templates/{templateId}/` folder in Blob
- Template configs are stored as `templates/{templateId}/config.json`
- The frontend handles all canvas rendering client-side
- The backend only handles: upload, AI detection, and config persistence
