// commands/wcg.js - Word Chain Game
const fs = require('fs');
const path = require('path');

const games = {};

async function wcgCommand(sock, chatId, senderId, args) {
    const sub = (args[0] || '').toLowerCase();

    switch(sub) {
        case 'start': {
            if (games[chatId]) return sock.sendMessage(chatId, { text: '❌ A game is already running! Use .wcg stop to end it.' });
            games[chatId] = { words: [], lastLetter: null, lastPlayer: null, scores: {} };
            return sock.sendMessage(chatId, { text: '🔤 *Word Chain Game Started!*\n\nRules:\n- Each word must start with the last letter of the previous word\n- No repeating words\n- Type any word to play!\n\nType the first word to begin!' });
        }
        case 'stop': {
            if (!games[chatId]) return sock.sendMessage(chatId, { text: '❌ No game running.' });
            const game = games[chatId];
            let scores = '🏁 *Game Over!*\n\n📊 Scores:\n';
            const sorted = Object.entries(game.scores).sort((a,b) => b[1]-a[1]);
            if (sorted.length === 0) {
                scores += 'No words were played.';
            } else {
                sorted.forEach(([id, score], i) => {
                    scores += ${i+1}. @${id}: ${score} words\n;
                });
            }
            delete games[chatId];
            return sock.sendMessage(chatId, { text: scores });
        }
        case 'status': {
            if (!games[chatId]) return sock.sendMessage(chatId, { text: '❌ No game running.' });
            const game = games[chatId];
            return sock.sendMessage(chatId, {
                text: 🔤 *WCG Status*\n\n +
                    Words played: ${game.words.length}\n +
                    Last word: ${game.words[game.words.length-1] || 'none'}\n +
                    Next must start with: *${game.lastLetter ? game.lastLetter.toUpperCase() : 'anything'}*
            });
        }
        default:
            return sock.sendMessage(chatId, { text: '❌ Usage: .wcg start | .wcg stop | .wcg status' });
    }
}

async function handleWcgWord(sock, chatId, senderId, word) {
    if (!games[chatId]) return false;
    const game = games[chatId];
    const clean = word.toLowerCase().trim();

    if (!/^[a-z]+$/.test(clean)) return false;
    if (game.words.includes(clean)) {
        await sock.sendMessage(chatId, { text: ❌ "*${clean}*" already used! Try another word. });
        return true;
    }
    if (game.lastLetter && clean[0] !== game.lastLetter) {
        await sock.sendMessage(chatId, { text: ❌ Word must start with *${game.lastLetter.toUpperCase()}*! });
        return true;
    }

    game.words.push(clean);
    game.lastLetter = clean[clean.length-1];
    const playerId = String(senderId).split('@')[0].replace(/\D/g,'');
    game.scores[playerId] = (game.scores[playerId] || 0) + 1;
    game.lastPlayer = senderId;

    await sock.sendMessage(chatId, { text: ✅ *${clean}* — Next word must start with *${game.lastLetter.toUpperCase()}* });
    return true;
}

module.exports = { wcgCommand, handleWcgWord };