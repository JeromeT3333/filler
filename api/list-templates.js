export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.vercel.com/v2/blob', {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list blobs');
    }

    const data = await response.json();

    const templates = data.blobs
      ?.filter(b => b.pathname && b.pathname.includes('/config.json'))
      ?.map(b => {
        const parts = b.pathname.split('/');
        return {
          templateId: parts[1],
          url: b.url,
          updatedAt: b.uploadedAt || new Date().toISOString()
        };
      }) || [];

    res.status(200).json({ templates });

  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: error.message, templates: [] });
  }
}