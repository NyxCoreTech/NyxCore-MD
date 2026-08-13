// commands/ownertools.js - Owner tools (prefix, sudo management)
const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, '../data/prefix.json');
const SUDO_FILE = path.join(__dirname, '../data/sudo.json');

function getPrefix() {
    try { return JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8')).prefix || '.'; }
    catch { return '.'; }
}

function setPrefix(p) {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify({ prefix: p }, null, 2));
}

function getSudo() {
    try { return JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8')); }
    catch { return []; }
}

function saveSudo(list) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify(list, null, 2));
}

async function ownerToolsCommand(sock, chatId, senderId, command, args) {
    switch(command) {
        case 'setprefix': {
            if (!args[0]) return sock.sendMessage(chatId, { text: '❌ Usage: .setprefix <symbol>' });
            const newPrefix = args[0].trim();
            setPrefix(newPrefix);
            return sock.sendMessage(chatId, { text: `✅ Prefix changed to: *${newPrefix}*\nAll commands now use *${newPrefix}* instead of *.`});
        }
        case 'setsudo': {
            if (!args[0]) return sock.sendMessage(chatId, { text: '❌ Usage: .setsudo @user' });
            const targetId = args[0].replace(/\D/g, '');
            const sudo = getSudo();
            if (sudo.includes(targetId)) return sock.sendMessage(chatId, { text: ❌ @${targetId} is already a sudo user., mentions: [targetId+'@s.whatsapp.net'] });
            sudo.push(targetId);
            saveSudo(sudo);
            return sock.sendMessage(chatId, { text: ✅ @${targetId} added as sudo user., mentions: [targetId+'@s.whatsapp.net'] });
        }
        case 'delsudo': {
            if (!args[0]) return sock.sendMessage(chatId, { text: '❌ Usage: .delsudo @user' });
            const targetId = args[0].replace(/\D/g, '');
            let sudo = getSudo();
            if (!sudo.includes(targetId)) return sock.sendMessage(chatId, { text: ❌ @${targetId} is not a sudo user., mentions: [targetId+'@s.whatsapp.net'] });
            sudo = sudo.filter(id => id !== targetId);
            saveSudo(sudo);
            return sock.sendMessage(chatId, { text: ✅ @${targetId} removed from sudo., mentions: [targetId+'@s.whatsapp.net'] });
        }
        case 'listsudo': {
            const sudo = getSudo();
            if (sudo.length === 0) return sock.sendMessage(chatId, { text: '📋 No sudo users set.' });
            const list = sudo.map((id, i) => `${i+1}. @${id}`).join('\n');
            return sock.sendMessage(chatId, {
                text: 📋 *Sudo Users:*\n\n${list},
                mentions: sudo.map(id => id+'@s.whatsapp.net')
            });
        }
        default:
            return sock.sendMessage(chatId, { text: '❌ Unknown owner command.' });
    }
}

module.exports = { ownerToolsCommand, getPrefix };