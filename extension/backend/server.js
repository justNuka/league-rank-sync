require('dotenv').config();

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const app = express();
const path = require('path');

// Variables d'environnement (client IDs, secrets)
const RIOT_CLIENT_ID = process.env.RIOT_CLIENT_ID;
const RIOT_CLIENT_SECRET = process.env.RIOT_CLIENT_SECRET;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
console.log(RIOT_CLIENT_ID, RIOT_CLIENT_SECRET, TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET);

const port = process.env.PORT || 3000;

// Route pour servir la page de base avec les deux boutons
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Assure-toi que index.html est bien à la racine de ton projet
});

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
    const redirectUri = process.env.REDIRECT_URI;
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read:email+openid`;

    res.redirect(twitchAuthUrl);
});

// Route pour récupérer le token Twitch après authentification
app.get('/auth/twitch/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.REDIRECT_URI,
        });

        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        const idToken = response.data.id_token;

        let user = null;
        if (idToken) {
            user = jwt.decode(idToken);
        }

        // res.json({ accessToken, refreshToken, user });
        res.send(`
            <h1>Bienvenue, ${user.preferred_username}!</h1>
            <p>ID utilisateur : ${user.sub}</p>
            <p>Token d'accès : ${accessToken}</p>
            <p>Token de rafraîchissement : ${refreshToken}</p>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send('Erreur lors de l\'authentification Twitch');
    }
});

// Route pour récupérer les informations d'un joueur League of Legends
async function getRank(summonerId) {
    try {
        const response = await axios.get(`https://<region>.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}?api_key=${RIOT_API_KEY}`);
        const rankedData = response.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        return rankedData ? rankedData.tier + ' ' + rankedData.rank : 'Unranked';
    } catch (error) {
        console.error('Erreur lors de la récupération du rang', error);
        return 'Unranked';
    }
}

// Fonction pour ajouter un badge à côté du nom d'un utilisateur dans le chat
function addBadgeToChatUser(username, rank) {
    const chatMessages = document.querySelectorAll('.chat-line__message');
    chatMessages.forEach(message => {
        const nameElement = message.querySelector('.chat-author__display-name');
        if (nameElement && nameElement.textContent === username) {
            const badge = document.createElement('span');
            badge.classList.add('rank-badge');
            badge.textContent = rank;
            nameElement.appendChild(badge);
        }
    });
}

// Démarrer le serveur
// app.listen(port, () => {
//     console.log(`Serveur démarré sur http://localhost:${port}`);
// });
app.listen(port, () => {
    console.log(`Serveur démarré sur ${port}`);
});