import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const API_BASE_URL = "https://router.huggingface.co/v1";
const HF_TOKEN = process.env.HUGGING_FACE_API_TOKEN;

import fs from 'fs';

function log(message) {
    fs.appendFileSync('debug_log.txt', message + '\n');
}

console.log("Token exists:", !!HF_TOKEN);
log("Token exists: " + !!HF_TOKEN);
if (HF_TOKEN) {
    log("Token length: " + HF_TOKEN.length);
    log("Token start: " + HF_TOKEN.substring(0, 4));
}

async function test() {
    try {
        log("Testing API connection...");
        const response = await axios.post(
            `${API_BASE_URL}/chat/completions`,
            {
                model: "meta-llama/Llama-3.1-8B-Instruct",
                messages: [{ role: "user", content: "Hello" }],
                max_tokens: 10
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        log("Success! Response: " + JSON.stringify(response.data, null, 2));
    } catch (error) {
        log("Error Details:");
        if (error.response) {
            log("Status: " + error.response.status);
            log("Data: " + JSON.stringify(error.response.data, null, 2));
        } else {
            log("Message: " + error.message);
        }
    }
}

test();
