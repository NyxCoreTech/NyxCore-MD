// lib/checkOwner.js - Owner & sudo checker with LID support
const fs = require('fs');
const path = require('path');

const OWNERS = [
    '2349036543288',
    '96718368596114'
];

function isOwner(senderId) {
    const clean = String(senderId).split('@')[0].split(':')[0].replace(/\D/g, '');
    return OWNERS.includes(clean);
}

function isSudoUser(senderId) {
    try {
        const sudoFile = path.join(__dirname, '../data/sudo.json');
        const sudoList = JSON.parse(fs.readFileSync(sudoFile, 'utf8'));
        const clean = String(senderId).split('@')[0].split(':')[0].replace(/\D/g, '');
        return sudoList.includes(clean);
    } catch { return false; }
}

function isOwnerOrSudo(senderId) {
    return isOwner(senderId) || isSudoUser(senderId);
}

module.exports = isOwnerOrSudo;
module.exports.isOwner = isOwner;
module.exports.isSudoUser = isSudoUser;