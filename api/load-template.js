export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { templateId } = req.query;

    if (!templateId) {
      return res.status(400).json({ error: 'Missing templateId' });
    }

    const configUrl = `https://public.blob.vercel-storage.com/templates/${templateId}/config.json`;
    const response = await fetch(configUrl);

    if (!response.ok) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: error.message });
  }
}