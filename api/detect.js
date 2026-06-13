export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, apiKey, imageWidth, imageHeight } = req.body;

    if (!imageUrl || !apiKey) {
      return res.status(400).json({ error: 'Missing imageUrl or apiKey' });
    }

    const prompt = `Analyze this document/form template image carefully. Identify ALL text input fields, labels, photo/image placeholders, signature areas, checkboxes, and icons.

For each field, provide:
1. Field type: "text" (for text input/label areas), "image" (for photo/profile picture placeholders), "signature" (for signature boxes), "icon" (for small icons/logos), "checkbox" (for check/tick boxes)
2. A descriptive name for the field
3. The approximate bounding box as normalized coordinates (x1, y1, x2, y2) where 0,0 is top-left and 1,1 is bottom-right

IMPORTANT RULES:
- Merge adjacent text that forms a single logical field (e.g., "First Name" as one field, not "First" and "Name" separately)
- A label and its corresponding input box should be SEPARATE entries if visually distinct
- Photo/image placeholders are usually rectangular boxes with border patterns or "Photo" text inside
- Signature areas often have lines at the bottom
- Return ONLY a JSON array. No markdown, no explanation.

Format:
[
  {"type":"text","name":"Full Name","x1":0.1,"y1":0.2,"x2":0.4,"y2":0.25},
  {"type":"image","name":"Profile Photo","x1":0.5,"y1":0.1,"x2":0.7,"y2":0.4}
]`;

    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Data = Buffer.from(imageBuffer).toString('base64');

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    let text = geminiData.candidates[0].content.parts[0].text;

    const jsonMatch = text.match(/\[.*?\]/s);
    if (!jsonMatch) {
      throw new Error('No JSON array found in Gemini response');
    }

    const geminiFields = JSON.parse(jsonMatch[0]);

    const w = imageWidth || 1000;
    const h = imageHeight || 1000;

    const processedDetections = geminiFields.map((field, idx) => {
      const x1 = Math.max(0, Math.min(1, field.x1 || 0));
      const y1 = Math.max(0, Math.min(1, field.y1 || 0));
      const x2 = Math.max(0, Math.min(1, field.x2 || 1));
      const y2 = Math.max(0, Math.min(1, field.y2 || 1));

      return {
        id: idx,
        x: Math.round(x1 * w),
        y: Math.round(y1 * h),
        w: Math.round((x2 - x1) * w),
        h: Math.round((y2 - y1) * h),
        type: field.type || 'text',
        name: field.name || `${field.type || 'field'}_${idx + 1}`,
        confidence: 'high',
        gemini: true
      };
    }).filter(d => d.w >= 15 && d.h >= 10);

    res.status(200).json({
      success: true,
      detections: processedDetections,
      count: processedDetections.length
    });

  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: error.message });
  }
}