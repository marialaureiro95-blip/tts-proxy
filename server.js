const express = require('express');
const app = express();

// ---- CONFIG ----
const ROBLOX_API_KEY = 'ArwsDxAZrEOkLEiQAmXbZlpJgZIpEkqGRyTPM8l7NBlgoW1eZXlKaGJHY2lPaUpTVXpJMU5pSXNJbXRwWkNJNkluTnBaeTB5TURJeExUQTNMVEV6VkRFNE9qVXhPalE1V2lJc0luUjVjQ0k2SWtwWFZDSjkuZXlKaGRXUWlPaUpTYjJKc2IzaEpiblJsY201aGJDSXNJbWx6Y3lJNklrTnNiM1ZrUVhWMGFHVnVkR2xqWVhScGIyNVRaWEoyYVdObElpd2lZbUZ6WlVGd2FVdGxlU0k2SWtGeWQzTkVlRUZhY2tWUGEweEZhVkZCYlZoaVdteHdTbWRhU1hCRmEzRkhVbmxVVUUwNGJEZE9RbXhuYjFjeFpTSXNJbTkzYm1WeVNXUWlPaUl4TVRFd056QTNPRFV5TkNJc0ltVjRjQ0k2TVRjNE1qYzVOVE14Tml3aWFXRjBJam94TnpneU56a3hOekUyTENKdVltWWlPakUzT0RJM09URTNNVFo5LmdfYS1IWGlnempOTGRRQUwyNUNTdW5WT0V5dnFfNEU3RTRzbHN4OXlvY2FhOGRteGhPWlV2a0dwbzJUM0c2NVZyc0hwUHdtUE5Yd3VMYzJJRGE2ZFU3bWJTam1NeFhjYnRsdXR6cEVmWGh6eHBmTUpKdUxNbTN5aldjczRxUkt2djFwVU1ad3I2Tm1BZmVqQ3RRUmJXYjFUSkktdjRCbzZyRHYwS1N5ZE1kall4RWx3cmp4dEJXUzF6MjVqbXg3a1BYQkFQaDZpVlFSdmhzMktWWXR6a1c0ZW8welR1emNlNFNfeVdXQUVKaXU2ZjlVNnlKdnhMSzlNZThJR0NHVkhnV1RHODJPSGlOTi1fN3I0cEJFb3ZMY2Z3aVpBMjYtNmVGampEdENYN2ctbldKM05uSjhRQXV0azRqQ1k0eHR3WVBNSFFrdlJ4M2N4YUU2WkV0QnNvQQ==';  // from Step 1
const UNIVERSE_ID = '10323370165';  // your game's Universe ID (found in Creator Dashboard > your game > Universe ID)
// ----------------

app.get('/', async (req, res) => {
  const text = req.query.text;
  if (!text || text.length > 200) {
    return res.status(400).send('Invalid text');
  }

  try {
    // 1. Get TTS audio from StreamElements (free, no API key needed)
    const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text)}`;
    const ttsResponse = await fetch(ttsUrl);
    
    if (!ttsResponse.ok) {
      return res.status(500).send('TTS failed');
    }

    const audioBuffer = await ttsResponse.arrayBuffer();

    // 2. Upload to Roblox via Open Cloud API
    const uploadUrl = `https://apis.roblox.com/assets/v1/assets`;
    
    // Roblox expects a multipart form: request metadata JSON + the audio file
    const formData = new FormData();
    formData.append('request', JSON.stringify({
      assetType: 'Audio',
      displayName: 'TTS_' + Date.now(),
      description: 'TTS generated audio'
    }));
    formData.append('fileContent', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'tts.mp3');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'x-api-key': ROBLOX_API_KEY,
        'universeId': UNIVERSE_ID
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      console.error('Upload failed:', uploadResponse.status, errText);
      return res.status(500).send('Upload failed');
    }

    const uploadResult = await uploadResponse.json();
    
    // 3. Return the asset ID (the format your Roblox script expects)
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ assetId: uploadResult.assetId }));
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => {
  console.log('TTS Proxy running on port 3000');
});
