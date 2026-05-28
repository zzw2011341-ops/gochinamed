export async function callHunyuan(
  messages: any[],
  options?: { model?: string; temperature?: number }
): Promise<string> {
  const apiKey = process.env.HUNYUAN_API_KEY || 'sk-sp-q9k6UedBfSttuDC0tzIPOesaScB9ywjiZ9vC62yDtXnt1eYr';
  const apiUrl = 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'hunyuan-pro',
        messages,
        temperature: options?.temperature || 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error('Hunyuan API error:', response.status, await response.text());
      return '[]';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '[]';
  } catch (error) {
    console.error('Hunyuan API call failed:', error);
    return '[]';
  }
}
