export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data manually
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const contentType = req.headers['content-type'] || '';
    const boundary = contentType.split('boundary=')[1];

    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found' });
    }

    const parts = buffer.toString('binary').split('--' + boundary);

    let fileBuffer = null;
    let fileName = 'image.jpg';
    let templateId = 'template_' + Date.now();
    let contentTypeFound = 'image/jpeg';

    for (const part of parts) {
      if (part.includes('filename=')) {
        const nameMatch = part.match(/filename="([^"]+)"/);
        if (nameMatch) fileName = nameMatch[1];

        // Get content-type from header
        const ctMatch = part.match(/Content-Type:\s*([^
]+)/i);
        if (ctMatch) contentTypeFound = ctMatch[1].trim();

        // Extract file content
        const headerEnd = part.indexOf('

');
        if (headerEnd !== -1) {
          const contentStart = headerEnd + 4;
          const contentEnd = part.length - 2; // Remove trailing 

          if (contentEnd > contentStart) {
            fileBuffer = Buffer.from(part.slice(contentStart, contentEnd), 'binary');
          }
        }
      }
      if (part.includes('name="templateId"')) {
        const idMatch = part.match(/

(.+?)(?:
)?$/);
        if (idMatch) templateId = idMatch[1].trim();
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload directly to Vercel Blob API using fetch
    const blobUrl = `https://blob.vercel-storage.com/templates/${templateId}/${fileName}`;

    const uploadResponse = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': contentTypeFound,
        'x-vercel-blob-content-type': contentTypeFound,
        'x-access': 'public'
      },
      body: fileBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Blob upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const blobData = await uploadResponse.json();

    res.status(200).json({
      success: true,
      url: blobData.url,
      templateId: templateId,
      pathname: blobData.pathname
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};