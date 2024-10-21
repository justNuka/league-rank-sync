// Appeler la fonction pour ajouter le badge une fois l'authentification réussie
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

// Exemple : ajouter un badge pour "SummonerName" après l'authentification
addBadgeToChatUser('SummonerName', 'Platinum III');