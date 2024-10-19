require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Variables d'environnement (client IDs, secrets)
const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

// Route pour l'authentification Riot
app.get('/auth/riot', (req, res) => {
    const redirectUri = `https://auth.riotgames.com/oauth/authorize?client_id=${RIOT_CLIENT_ID}&response_type=code&redirect_uri=${process.env.REDIRECT_URI}&scope=openid`;
    res.redirect(redirectUri);
});

// Route pour récupérer le token d'accès Riot après authentification
app.get('/auth/riot/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post('https://auth.riotgames.com/oauth/token', {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REDIRECT_URI,
            client_id: RIOT_CLIENT_ID,
            client_secret: RIOT_CLIENT_SECRET
        });

        const accessToken = response.data.access_token;
        res.json({ accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l\'authentification Riot');
    }
});

// Authentification via Twitch OAuth
app.get('/auth/twitch', (req, res) => {
    const redirectUri = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=user:read:email`;
    res.redirect(redirectUri);
});

// Route pour récupérer le token Twitch après authentification
app.get('/auth/twitch/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post(`https://id.twitch.tv/oauth2/token`, {
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.REDIRECT_URI,
        });

        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;

        // Décoder l'ID token si nécessaire pour récupérer des informations utilisateur
        const decoded = jwt.decode(response.data.id_token);

        res.json({ accessToken, refreshToken, user: decoded });
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l\'authentification Twitch');
    }
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});