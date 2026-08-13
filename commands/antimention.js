// commands/antimention.js - Anti mass-mention protection
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/antimention.json');

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); }
    catch { return {}; }
}

function saveSettings(data) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

async function antiMentionCommand(sock, chatId, senderId, args, isAdmin) {
    if (!isAdmin) return sock.sendMessage(chatId, { text: '❌ Only admins can use this command.' });
    
    const sub = (args[0] || '').toLowerCase();
    const settings = loadSettings();
    if (!settings[chatId]) settings[chatId] = { enabled: false, limit: 5 };

    switch(sub) {
        case 'on': case 'enable': {
            settings[chatId].enabled = true;
            saveSettings(settings);
            return sock.sendMessage(chatId, { text: '✅ Anti-mention enabled! Members who mention 5+ people will be kicked.' });
        }
        case 'off': case 'disable': {
            settings[chatId].enabled = false;
            saveSettings(settings);
            return sock.sendMessage(chatId, { text: '✅ Anti-mention disabled.' });
        }
        case 'status': {
            const status = settings[chatId].enabled ? '✅ Enabled' : '❌ Disabled';
            return sock.sendMessage(chatId, { text: 🔔 Anti-mention: ${status}\nMention limit: ${settings[chatId].limit} });
        }
        default:
            return sock.sendMessage(chatId, { text: '❌ Usage: .antimention on | off | status' });
    }
}

async function handleAntiMention(sock, chatId, senderId, mentions, isAdmin, isBotAdmin) {
    if (!isBotAdmin) return;
    const settings = loadSettings();
    if (!settings[chatId] || !settings[chatId].enabled) return;
    if (isAdmin) return;
    if (!mentions  mentions.length < (settings[chatId].limit  5)) return;

    try {
        await sock.sendMessage(chatId, {
            text: ⚠️ @${String(senderId).split('@')[0]} was kicked for mass-mentioning ${mentions.length} members!,
            mentions: [senderId]
        });
        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
    } catch (e) {
        console.error('Anti-mention kick failed:', e);
    }
}

module.exports = { antiMentionCommand, handleAntiMention };
