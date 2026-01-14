
import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
// Tell Express to serve everything inside the 'frontend' folder
app.use(express.static('frontend'));

// The base URL for the OpenAI-compatible router
const API_BASE_URL = "https://router.huggingface.co/v1";
const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

// Create the /chat endpoint
app.post('/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Prepare the payload for the Hugging Face Router
        const payload = {
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [{ role: "user", content: message }],
            max_tokens: 500,
            temperature: 0.7
        };

        // Note the URL now includes "/chat/completions"
        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // The response structure is also different
        const modelResponse = response.data.choices[0]?.message?.content || "Sorry, I couldn't get a response.";

        console.log("Received response:", modelResponse);
        res.json({ reply: modelResponse });

    } catch (error) {
        // Log the detailed error from the API if it exists
        const errorDetails = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
        console.error('Error calling Hugging Face Router API:', errorDetails);
        res.status(500).json({ error: 'Failed to get response from AI model' });
    }
});

// Create the /advisory endpoint for AI-powered agricultural advisory
app.post('/advisory', async (req, res) => {
    const { soilData, weatherData, district, crop } = req.body;

    if (!soilData || !weatherData) {
        return res.status(400).json({ error: 'Soil data and weather data are required' });
    }

    try {
        // Construct a detailed agricultural prompt
        const prompt = `You are an expert agricultural advisor. Based on the following farm data, provide specific, actionable farming recommendations.

**Location**: ${district || 'Not specified'}
**Crop**: ${crop || 'General farming'}

**Soil Data**:
${Object.entries(soilData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

**Weather Data**:
- Temperature: ${weatherData.tempC}°C
- Condition: ${weatherData.condition}
- Humidity: ${weatherData.humidity}%
- Wind Speed: ${weatherData.windKmh} km/h
- City: ${weatherData.city}

Please provide:
1. Irrigation recommendations based on soil moisture and weather
2. Fertilizer suggestions based on soil nutrients
3. Pest and disease warnings based on current weather
4. Any immediate actions needed

Keep each recommendation concise and actionable. Format each recommendation on a new line.`;

        // Call Hugging Face API
        const payload = {
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
            temperature: 0.7
        };

        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const advisory = response.data.choices[0]?.message?.content || "Unable to generate advisory at this time.";

        console.log("Generated advisory:", advisory);
        res.json({ advisory, soilData, weatherData });

    } catch (error) {
        const errorDetails = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
        console.error('Error calling Hugging Face API for advisory:', errorDetails);
        res.status(500).json({ error: 'Failed to generate advisory' });
    }
});

// This tells the server what to do when it gets a GET request for the root URL

app.listen(PORT, () => {
    console.log(`✨ Server is running on http://localhost:${PORT}`);
});