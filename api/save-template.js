export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateId, config, imageUrl } = req.body;

    if (!templateId || !config) {
      return res.status(400).json({ error: 'Missing templateId or config' });
    }

    const templateData = JSON.stringify({
      templateId,
      imageUrl,
      config,
      updatedAt: new Date().toISOString()
    });

    // Upload directly to Vercel Blob API
    const blobUrl = `https://blob.vercel-storage.com/templates/${templateId}/config.json`;

    const uploadResponse = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        'Content-Type': 'application/json',
        'x-vercel-blob-content-type': 'application/json',
        'x-access': 'public'
      },
      body: templateData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Blob upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const blobData = await uploadResponse.json();

    res.status(200).json({
      success: true,
      url: blobData.url,
      templateId: templateId
    });

  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message });
  }
}