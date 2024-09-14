const express = require('express');
const cors = require('cors');
const path = require('path');
// const fetch = require('node-fetch'); // Add this if not already

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the "public" directory (where your index.html and frontend files should be)
app.use(express.static(path.join(__dirname, 'public')));

// Temporary storage for user data
let userData = {};

// Create Chat Session function
async function createChatSession(apiKey, externalUserId) {
    try {
        const response = await fetch('https://api.on-demand.io/chat/v1/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                pluginIds: [],
                externalUserId: externalUserId
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.data && data.data.id) {
            return data.data.id;
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Submit Query function
async function submitQuery(apiKey, sessionId, query) {
    const response = await fetch(`https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
        },
        body: JSON.stringify({
            endpointId: 'predefined-openai-gpt4o',
            query: query,
            pluginIds: ['plugin-1726256037', 'plugin-1726244582'],
            responseMode: 'sync'
        })
    });

    const data = await response.json();
    return data;
}

// Store user details route

app.post('/store-user', (req, res) => {
    const { name, age, gender, weight, height, goals, lifestyle_habits, medical_history } = req.body;
    userData = { name, age, gender, weight, height, goals, lifestyle_habits, medical_history }; // Store the user data
    res.json({ message: 'User data stored successfully!' });
});

app.post('/content', async (req, res) => {
    const { externalUserId, query } = req.body;
    const apiKey = 'fEg0zuUn0kpMdxhFsd5j9eT3t78xp5Kn';

    if (!userData.name || !userData.age || !userData.weight || !userData.height || !userData.gender) {
        return res.status(400).json({ message: 'Please provide complete user details including gender.' });
    }

    try {
        let personalizedQuery = query;

        if (query.toLowerCase().includes('diet plan')) {
            personalizedQuery = `Based on the user's details: Age ${userData.age}, Gender ${userData.gender}, Weight ${userData.weight}kg, Height ${userData.height}cm, Goals: ${userData.goals || 'N/A'}, Lifestyle: ${userData.lifestyle_habits || 'N/A'}, Medical history: ${userData.medical_history || 'N/A'}, suggest a diet plan.`;
        } else if (query.toLowerCase().includes('nutrition')) {
            personalizedQuery = `Considering the user is ${userData.age} years old, Gender ${userData.gender}, weighs ${userData.weight}kg, and is ${userData.height}cm tall, Goals: ${userData.goals || 'N/A'}, Lifestyle: ${userData.lifestyle_habits || 'N/A'}, Medical history: ${userData.medical_history || 'N/A'}, suggest nutritious food options.`;
        }

        const sessionId = await createChatSession(apiKey, externalUserId);
        const response = await submitQuery(apiKey, sessionId, personalizedQuery);
        res.json(response);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});


// Catch-all route to serve the index.html file for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
