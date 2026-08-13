// commands/economy.js - Economy system for NyxCore-MD
const fs = require('fs');
const path = require('path');

const ECONOMY_FILE = path.join(__dirname, '../data/economy.json');

function loadEconomy() {
    try { return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8')); }
    catch { return {}; }
}

function saveEconomy(data) {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}

function getUser(data, id) {
    const clean = String(id).split('@')[0].replace(/\D/g, '');
    if (!data[clean]) data[clean] = { wallet: 0, bank: 0, lastDaily: 0, lastWork: 0 };
    return data[clean];
}

function fmt(n) {
    if (n >= 1e12) return (n/1e12).toFixed(1)+'T';
    if (n >= 1e9) return (n/1e9).toFixed(1)+'B';
    if (n >= 1e6) return (n/1e6).toFixed(1)+'M';
    if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
    return n.toString();
}

const WORKS = [
    'You coded all night and earned', 'You sold beats and got',
    'You drove Uber and made', 'You freelanced and earned',
    'You flipped items and got', 'You won a bet and earned'
];

async function economyCommand(sock, chatId, senderId, command, args) {
    const data = loadEconomy();
    const user = getUser(data, senderId);
    const clean = String(senderId).split('@')[0].replace(/\D/g, '');
    const now = Date.now();

    switch(command) {
        case 'balance': case 'bal': {
            saveEconomy(data);
            return sock.sendMessage(chatId, { text:
                💰 *Your Balance*\n\n +
                👛 Wallet: ◈ ${fmt(user.wallet)}\n +
                🏦 Bank: ◈ ${fmt(user.bank)}
            });
        }
        case 'daily': {
            const cooldown = 24*60*60*1000;
            if (now - user.lastDaily < cooldown) {
                const left = cooldown - (now - user.lastDaily);
                const hrs = Math.floor(left/3600000);
                const mins = Math.floor((left%3600000)/60000);
                return sock.sendMessage(chatId, { text: ⏳ Daily cooldown: *${hrs}h ${mins}m* remaining. });
            }
            const amount = Math.floor(Math.random()*4500)+500;
            user.wallet += amount;
            user.lastDaily = now;
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: ✅ You claimed your daily reward!\n+◈ ${fmt(amount)} added to wallet. });
        }
        case 'work': {
            const cooldown = 2*60*60*1000;
            if (now - user.lastWork < cooldown) {
                const left = cooldown - (now - user.lastWork);
                const mins = Math.floor(left/60000);
                return sock.sendMessage(chatId, { text: ⏳ Work cooldown: *${mins}m* remaining. });
            }
            const amount = Math.floor(Math.random()*900)+100;
            user.wallet += amount;
            user.lastWork = now;
            saveEconomy(data);
            const msg = WORKS[Math.floor(Math.random()*WORKS.length)];
            return sock.sendMessage(chatId, { text: 💼 ${msg} ◈ ${fmt(amount)}! });
        }
        case 'deposit': case 'dep': {
            const amt = args[0] === 'all' ? user.wallet : parseInt(args[0]);
            if (!amt || amt <= 0) return sock.sendMessage(chatId, { text: '❌ Usage: .deposit <amount|all>' });
            if (amt > user.wallet) return sock.sendMessage(chatId, { text: '❌ Not enough in wallet.' });
            user.wallet -= amt; user.bank += amt;
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: 🏦 Deposited ◈ ${fmt(amt)} to bank. });
        }
        case 'withdraw': case 'with': {
            const amt = args[0] === 'all' ? user.bank : parseInt(args[0]);
            if (!amt || amt <= 0) return sock.sendMessage(chatId, { text: '❌ Usage: .withdraw <amount|all>' });
            if (amt > user.bank) return sock.sendMessage(chatId, { text: '❌ Not enough in bank.' });
            user.bank -= amt; user.wallet += amt;
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: 👛 Withdrew ◈ ${fmt(amt)} to wallet. });
        }
        case 'richest': case 'top': {
            const sorted = Object.
entries(data)
                .map(([id, u]) => ({ id, total: (u.wallet||0)+(u.bank||0) }))
                .sort((a,b) => b.total - a.total).slice(0,10);
            let msg = '🏆 *Richest Users*\n\n';
            sorted.forEach((u,i) => { msg += ${i+1}. ${u.id}: ◈ ${fmt(u.total)}\n; });
            return sock.sendMessage(chatId, { text: msg });
        }
        case 'pay': {
            if (!args[0] || !args[1]) return sock.sendMessage(chatId, { text: '❌ Usage: .pay @user <amount>' });
            const targetId = args[0].replace(/\D/g,'');
            const amt = parseInt(args[1]);
            if (!amt || amt <= 0) return sock.sendMessage(chatId, { text: '❌ Invalid amount.' });
            if (amt > user.wallet) return sock.sendMessage(chatId, { text: '❌ Not enough in wallet.' });
            const target = getUser(data, targetId);
            user.wallet -= amt; target.wallet += amt;
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: ✅ Paid ◈ ${fmt(amt)} to @${targetId}, mentions: [targetId+'@s.whatsapp.net'] });
        }
        case 'rob': {
            if (!args[0]) return sock.sendMessage(chatId, { text: '❌ Usage: .rob @user' });
            const targetId = args[0].replace(/\D/g,'');
            if (targetId === clean) return sock.sendMessage(chatId, { text: '❌ You cannot rob yourself.' });
            const target = getUser(data, targetId);
            if (target.wallet < 100) return sock.sendMessage(chatId, { text: '❌ Target has less than ◈100 in wallet.' });
            const success = Math.random() > 0.4;
            if (success) {
                const amt = Math.floor(target.wallet * (Math.random()*0.3+0.1));
                target.wallet -= amt; user.wallet += amt;
                saveEconomy(data);
                return sock.sendMessage(chatId, { text: 🦹 Rob successful! Stole ◈ ${fmt(amt)} from @${targetId}, mentions: [targetId+'@s.whatsapp.net'] });
            } else {
                const fine = Math.floor(user.wallet * 0.1);
                user.wallet -= fine;
                saveEconomy(data);
                return sock.sendMessage(chatId, { text: 👮 Rob failed! You got caught and paid ◈ ${fmt(fine)} fine. });
            }
        }
        // Owner commands
        case 'addcoins': {
            if (!args[0] || !args[1]) return sock.sendMessage(chatId, { text: '❌ Usage: .addcoins @user <amount>' });
            const targetId = args[0].replace(/\D/g,'');
            const amt = parseInt(args[1]);
            getUser(data, targetId).wallet += amt;
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: ✅ Added ◈ ${fmt(amt)} to @${targetId}, mentions: [targetId+'@s.whatsapp.net'] });
        }
        case 'removecoins': {
            if (!args[0] || !args[1]) return sock.sendMessage(chatId, { text: '❌ Usage: .removecoins @user <amount>' });
            const targetId = args[0].replace(/\D/g,'');
            const amt = parseInt(args[1]);
            getUser(data, targetId).wallet = Math.max(0, getUser(data, targetId).wallet - amt);
            saveEconomy(data);
            return sock.sendMessage(chatId, { text: ✅ Removed ◈ ${fmt(amt)} from @${targetId}, mentions: [targetId+'@s.whatsapp.net'] });
        }
        case 'reseteconomy': {
            fs.writeFileSync(ECONOMY_FILE, '{}');
            return sock.sendMessage(chatId, { text: '✅ Economy reset.' });
        }
        default:
            return sock.sendMessage(chatId, { text: '❌ Unknown economy command.' });
    }
}

module.exports = { economyCommand };
