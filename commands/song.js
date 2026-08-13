// commands/song.js - Music downloader using David Cyril API
const axios = require('axios');

async function songCommand(sock, chatId, args) {
    if (!args || args.length === 0) {
        return sock.sendMessage(chatId, { text: '❌ Usage: .song <song name>' });
    }

    const query = args.join(' ');
    await sock.sendMessage(chatId, { text: 🔍 Searching for: *${query}*... });

    try {
        // Step 1: Search YouTube
        const searchRes = await axios.get(`https://apis.davidcyril.name.ng/api/ytsearch`, {
            params: { query },
            timeout: 15000
        });

        const results = searchRes.data?.results || searchRes.data?.data;
        if (!results || results.length === 0) {
            return sock.sendMessage(chatId, { text: '❌ No results found for: ' + query });
        }

        const video = results[0];
        const videoUrl = video.url  video.link  https://www.youtube.com/watch?v=${video.id};
        const title = video.title || query;
        const duration = video.duration || 'Unknown';

        await sock.sendMessage(chatId, { text: 🎵 Found: *${title}*\n⏱ Duration: ${duration}\n⬇️ Downloading... });

        // Step 2: Download via AIO downloader
        const dlRes = await axios.get(`https://apis.davidcyril.name.ng/api/download/aio`, {
            params: { url: videoUrl },
            timeout: 30000
        });

        const dlData = dlRes.data?.data || dlRes.data;
        const audioUrl = dlData?.audio  dlData?.mp3  dlData?.download_url;

        if (!audioUrl) {
            // Fallback: try siputzx
            const fallback = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3`, {
                params: { url: videoUrl },
                timeout: 20000
            });
            const fbUrl = fallback.data?.data?.dl || fallback.data?.dl;
            if (!fbUrl) return sock.sendMessage(chatId, { text: '❌ Download failed. Try again later.' });

            return await sock.sendMessage(chatId, {
                audio: { url: fbUrl },
                mimetype: 'audio/mpeg',
                fileName: ${title}.mp3,
                contextInfo: { externalAdReply: {
                    title: title,
                    body: 'NyxCore-MD Music',
                    thumbnailUrl: video.thumbnail || '',
                    mediaType: 1
                }}
            }, { quoted: null });
        }

        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: ${title}.mp3,
            contextInfo: { externalAdReply: {
                title: title,
                body: 'NyxCore-MD Music',
                thumbnailUrl: video.thumbnail || '',
                mediaType: 1
            }}
        });

    } catch (err) {
        console.error('Song command error:', err.message);
        return sock.sendMessage(chatId, { text: '❌ Failed to download song. Please try again.' });
    }
}

module.exports = { songCommand };