const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

let waSocket = null;
let currentQrDataUrl = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'qr_ready' | 'connecting' | 'connected'
let retryCount = 0;

// Format phone number to international 91 format for India
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

const initBaileys = async () => {
  try {
    const authDir = path.join(__dirname, '../auth_info_baileys');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    waSocket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['AparnaCanteen Server', 'Chrome', '1.0.0']
    });

    waSocket.ev.on('creds.update', saveCreds);

    waSocket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'qr_ready';
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr);
          console.log('[Baileys] New WhatsApp QR Code generated for Admin scanner');
        } catch (qrErr) {
          console.error('Failed to generate QR data URL:', qrErr);
        }
      }

      if (connection === 'connecting') {
        connectionStatus = 'connecting';
        console.log('[Baileys] Connecting to WhatsApp network...');
      }

      if (connection === 'open') {
        connectionStatus = 'connected';
        currentQrDataUrl = null;
        retryCount = 0;
        console.log('[Baileys] ✅ WhatsApp connected successfully!');
      }

      if (connection === 'close') {
        connectionStatus = 'disconnected';
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[Baileys] Connection closed (Status: ${statusCode}). Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect && retryCount < 5) {
          retryCount++;
          setTimeout(initBaileys, 3000);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log('[Baileys] Logged out from WhatsApp. Resetting session...');
          currentQrDataUrl = null;
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(initBaileys, 3000);
        }
      }
    });

  } catch (err) {
    console.error('[Baileys] Error initializing socket:', err.message);
  }
};

const getWhatsAppStatus = () => {
  return {
    status: connectionStatus,
    qrDataUrl: currentQrDataUrl,
    isConnected: connectionStatus === 'connected'
  };
};

const sendAutoWhatsApp = async (phone, messageText) => {
  try {
    if (connectionStatus !== 'connected' || !waSocket) {
      console.log(`[Baileys Skipped - Not Connected] To ${phone}: ${messageText.substring(0, 50)}...`);
      return { success: false, message: 'WhatsApp is not connected' };
    }

    const formatted = formatPhoneNumber(phone);
    if (!formatted) {
      return { success: false, message: 'Invalid phone number' };
    }

    const jid = `${formatted}@s.whatsapp.net`;
    await waSocket.sendMessage(jid, { text: messageText });
    console.log(`[Baileys Auto Sent] WhatsApp delivered to ${formatted}`);
    return { success: true };

  } catch (err) {
    console.error('[Baileys Send Error]:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  initBaileys,
  getWhatsAppStatus,
  sendAutoWhatsApp
};
