require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { getLastStudySession, getAllStudySessions, createStudySession } = require('./services/studySessionService');

app.use(bodyParser.json());

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Public endpoint (no authentication required)
app.get('/api/public', (req, res) => {
    res.json({ message: 'This is a public endpoint' });
});

// Endpoint to get the last study session
app.get('/api/dashboard/last_study_session', async (req, res) => {
    console.log('GET /api/dashboard/last_study_session called');
    try {
        const lastStudySession = await getLastStudySession();
        res.json(lastStudySession);
    } catch (error) {
        console.error('Error in GET /api/dashboard/last_study_session:', error);
        res.status(500).json({ error: 'Failed to get last study session' });
    }
});

// Endpoint to get all study sessions
app.get('/api/dashboard/study_sessions', async (req, res) => {
    console.log('GET /api/dashboard/study_sessions called');
    try {
        const studySessions = await getAllStudySessions();
        res.json(studySessions);
    } catch (error) {
        console.error('Error in GET /api/dashboard/study_sessions:', error);
        res.status(500).json({ error: 'Failed to get study sessions' });
    }
});

// Endpoint to create a new study session
app.post('/api/dashboard/study_sessions', async (req, res) => {
    console.log('POST /api/dashboard/study_sessions called');
    try {
        const newSession = await createStudySession(req.body);
        res.status(201).json(newSession);
    } catch (error) {
        console.error('Error in POST /api/dashboard/study_sessions:', error);
        res.status(500).json({ error: 'Failed to create study session' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
