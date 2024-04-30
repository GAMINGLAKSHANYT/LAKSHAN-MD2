
require('./settings')
const config = require('./settings.js');
const { default: vajiraConnect, Browsers, useMultiFileAuthState, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, getAggregateVotesInPollMessage, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto } = require('@whiskeysockets/baileys')
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const yargs = require('yargs/yargs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const _ = require('lodash')
const moment = require('moment-timezone')
const axios = require('axios')
const developers = '94719199757'
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getsize, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')


//bug database
const { vajiratext1 } = require('./lib/bugs/vajiratext1')
const { vajiratext2 } = require('./lib/bugs/vajiratext2')
const { vajiratext3 } = require('./lib/bugs/vajiratext3')
const { vajiratext4 } = require('./lib/bugs/vajiratext4')
const { vajiratext5 } = require('./lib/bugs/vajiratext5')
const { buttonkal } = require('./lib/bugs/buttonkal')
const { virtex7 } = require('./lib/bugs/virtex7')
const { ngazap } = require('./lib/bugs/ngazap')
const { cttl } = require('./lib/bugs/cttl')
const { tizi } = require('./lib/bugs/tizi')
const { weg } = require('./lib/bugs/weg')


var low
try {
  low = require('lowdb')
} catch (e) {
  low = require('./lib/lowdb')
}

const { Low, JSONFile } = low
const mongoDB = require('./lib/mongoDB')
const { emojis, doReact } = require('./lib/autoreact.js');

global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '')

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
      new mongoDB(opts['db']) :
      new JSONFile(`src/database.json`)
)
global.DATABASE = global.db // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    chats: {},
    database: {},
    game: {},
    settings: {},
    others: {},
    sticker: {},
    anonymous: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

// save database every 30seconds
if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)

//============================================================================
async function startvajira() {
    const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName}`)

    const vajira = vajiraConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ['Vajira Md Multi Device','Safari','1.0.0'],
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id)
                return msg.message || undefined
            }
            return {
                conversation: "Hai Im Vajira Md"
            }
        }
    })

  store.bind(vajira.ev)	
    					   

   vajira.ev.on('messages.upsert', async chatUpdate => {
        //console.log(JSON.stringify(chatUpdate, undefined, 2))
        try {
        mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (!vajira.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
        if (mek.key.id.startsWith('FatihArridho_')) return
        m = smsg(vajira, mek, store)
        require("./vajira")(vajira, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })

//============================================================================
/*	
//WELCOME LEFT
	   
vajira.ev.on('group-participants.update', async (anu) => {
    if (global.welcome) {
        console.log(anu);
        try {
            let metadata = await vajira.groupMetadata(anu.id);
            let participants = anu.participants;

            for (let num of participants) {
                try {
                    ppuser = await vajira.profilePictureUrl(num, 'image');
                } catch (err) {
                    ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60';
                }

                // Welcome message
                if (anu.action == 'add') {
                    const userName = num.split('@')[0];
                    const joinTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
                    const joinDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
                    const membersCount = metadata.participants.length;

                    const welcomeMessage = `> Hello @${userName}! Welcome to *${metadata.subject}*.\n> You are the ${membersCount}th member.\n> Joined at: ${joinTime} on ${joinDate}`;

                    vajira.sendMessage(anu.id, {
                        text: welcomeMessage,
                        contextInfo: {
                            externalAdReply: {
                                showAdAttribution: false,
                                title: userName,
                                sourceUrl: ppuser,
                                body: `${metadata.subject}`
                            }
                        }
                    });
                }
                // Left message
                else if (anu.action == 'remove') {
                    const userName = num.split('@')[0];
                    const leaveTime = moment.tz('Asia/Kolkata').format('HH:mm:ss');
                    const leaveDate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY');
                    const membersCount = metadata.participants.length;

                    const leftMessage = `> Goodbye @${userName} from ${metadata.subject}.\n> We are now ${membersCount} in the group.\n> Left at: ${leaveTime} on ${leaveDate}`;

                    vajira.sendMessage(anu.id, {
                        text: leftMessage,
                        contextInfo: {
                            externalAdReply: {
                                showAdAttribution: false,
                                title: userName,
                                sourceUrl: ppuser,
                                body: `${metadata.subject}`
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.log(err);
        }
    }
})

*/

//autoreact command


vajira.ev.on('messages.upsert', async chatUpdate => {
  try {
    if (process.env.AUTO_REACT ==='true') {
      const mek = chatUpdate.messages[0];
      console.log(mek);
      if (mek.message && !mek.key.fromMe) {
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        await doReact(randomEmoji, mek, vajira);
      }
    }
  } catch (err) {
    console.error('Error during auto reaction:', err);
  }
});

	
//farewell/welcome
    vajira.ev.on('group-participants.update', async (anu) => {
    	if (global.welcome){
console.log(anu)
try {
let metadata = await vajira.groupMetadata(anu.id)
let participants = anu.participants
for (let num of participants) {
try {
ppuser = await vajira.profilePictureUrl(num, 'image')
} catch (err) {
ppuser = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60'
}
try {
ppgroup = await vajira.profilePictureUrl(anu.id, 'image')
} catch (err) {
ppgroup = 'https://i.ibb.co/RBx5SQC/avatar-group-large-v2.png?q=60'
}
//welcome\\
memb = metadata.participants.length
vajiraWlcm = await getBuffer(ppuser)
vajiraLft = await getBuffer(ppuser)
                if (anu.action == 'add') {
                const vajirabuffer = await getBuffer(ppuser)
                let vajiraName = num
                const xtime = moment.tz('Asia/Kolkata').format('HH:mm:ss')
	            const xdate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY')
	            const xmembers = metadata.participants.length
                vajirabody = `┌─❖
│「 𝗛𝗶 👋 」
└┬❖ 「  @${vajiraName.split("@")[0]}  」
   │✑  𝗪𝗲𝗹𝗰𝗼𝗺𝗲 𝘁𝗼 
   │✑  ${metadata.subject}
   │✑  𝗠𝗲𝗺𝗯𝗲𝗿 : 
   │✑ ${xmembers}th
   │✑  𝗝𝗼𝗶𝗻𝗲𝗱 : 
   │✑ ${xtime} ${xdate}
   └───────────────┈ ⳹`
vajira.sendMessage(anu.id,
 { text: vajirabody,
 contextInfo:{
 mentionedJid:[num],
 "externalAdReply": {"showAdAttribution": true,
 "containsAutoReply": true,
 "title": `  👨‍💻 ＶＡＪＩＲＡ ＭＤ 👨‍💻`,
"body": `${ownername}`,
 "previewType": "PHOTO",
"thumbnailUrl": ``,
"thumbnail": vajiraWlcm,	     
"sourceUrl": `${ppuser}`}}})
                } else if (anu.action == 'remove') {
                	const vajirabuffer = await getBuffer(ppuser)
                    const vajiratime = moment.tz('Asia/Kolkata').format('HH:mm:ss')
	                const vajiradate = moment.tz('Asia/Kolkata').format('DD/MM/YYYY')
                	let vajiraName = num
                    const vajiramembers = metadata.participants.length
                    vajirabody = `┌─❖
│「 𝗚𝗼𝗼𝗱𝗯𝘆𝗲 👋 」
└┬❖ 「 @${vajiraName.split("@")[0]}  」
   │✑  𝗟𝗲𝗳𝘁 
   │✑ ${metadata.subject}
   │✑  𝗠𝗲𝗺𝗯𝗲𝗿 : 
   │✑ ${vajiramembers}th
   │✑  𝗧𝗶𝗺𝗲 : 
   │✑  ${vajiratime} ${vajiradate}
   └───────────────┈ ⳹`
vajira.sendMessage(anu.id,
 { text: vajirabody,
 contextInfo:{
 mentionedJid:[num],
 "externalAdReply": {"showAdAttribution": true,
 "containsAutoReply": true,
 "title": ` 👨‍💻 ＶＡＪＩＲＡ ＭＤ 👨‍💻`,
"body": `${ownername}`,
 "previewType": "PHOTO",
"thumbnailUrl": ``,
"thumbnail": vajiraLft,
"sourceUrl": `${ppuser}`}}})
	  }
}
} catch (err) {
console.log(err)
}
}
})
//============================================================================
	
//antidelete 
async function handleDeletedMessage(message) {
    try {
        const { fromMe, id, participant } = message;
        if (fromMe) {
            return;
        }

        let msg = this.serializeM(this.loadMessage(id));
        if (!msg) {
            return;
        }

        let chat = global.db.data.chats[msg.chat] || {};

        // Check if the message contains media
        let mediaUrl = '';
        let caption = 'Status Deleted'; // Default caption for deleted status

        // Check if it's an image
        if (msg.imageMessage) {
            mediaUrl = await vajira.downloadAndSaveMediaMessage(msg.imageMessage);
            caption = msg.imageMessage.caption || caption; // Use image caption if available
        }

        // Check if it's a video
        if (msg.videoMessage) {
            mediaUrl = await vajira.downloadAndSaveMediaMessage(msg.videoMessage);
            caption = msg.videoMessage.caption || caption; // Use video caption if available
        }

        const deletedMessageNotification = `
        ≡ Deleted Status 
        ┌─⊷  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀𝘿 𝙎𝙏𝘼𝙏𝙐𝙎 
        ▢ *Number :* @${participant.split`@`[0]} 
        └─────────────
        `.trim();

        await vajira.sendMessage(vajira.user.id, {
            text: deletedMessageNotification,
            media: { url: mediaUrl, caption: caption }
        });
    } catch (e) {
        console.error(e);
    }
}


async function deleteUpdate(message) {
    try {
        const {
            fromMe,
            id,
            participant
        } = message
        if (fromMe)
            return
        let msg = this.serializeM(this.loadMessage(id))
        if (!msg)
            return
        let chats = global.db.data.chats[msg.chats] || {}
       
            await this.reply(vajira.user.id, `
            ≡ deleted a message 
            ┌─⊷  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀 
            ▢ *Number :* @${participant.split`@`[0]} 
            └─────────────
            `.trim(), msg, {
                        mentions: [participant]
                    })
        this.copyNForward(vajira.user.id, msg, false).catch(e => console.log(e, msg))
    } catch (e) {
        console.error(e)
    }
}


//==============================ANTIBOT=====================================


  
    //autostatus view
        vajira.ev.on('messages.upsert', async chatUpdate => {
        	  if (process.env.AUTO_STATUS_VIEW ==='true') {
            mek = chatUpdate.messages[0]
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
            	await vajira.readMessages([mek.key]) }
            }
    })
    
// respon cmd pollMessage
async function getMessage(key) {
    if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message;
    }
    return {
        conversation: "Hai im vajira botwa",
    };
}

vajira.ev.on('messages.update', async chatUpdate => {
    for (const { key, update } of chatUpdate) {
        if (update.pollUpdates && key.fromMe) {
            const pollCreation = await getMessage(key);
            if (pollCreation) {
                const pollUpdate = await getAggregateVotesInPollMessage({
                    message: pollCreation,
                    pollUpdates: update.pollUpdates,
                });
                var toCmd = pollUpdate.filter(v => v.voters.length !== 0)[0]?.name;
                if (toCmd == undefined) return;
                var prefCmd = prefix + toCmd;

                try {
                    setTimeout(async () => {
                        await vajira.sendMessage(key.remoteJid, { delete: key });
                    }, 10000);
                } catch (error) {
                    console.error("Error deleting message:", error);
                }

                vajira.appenTextMessage(prefCmd, chatUpdate);
            }
        }
    }
});



	
	
    // Setting
    vajira.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    
    vajira.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = vajira.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    vajira.getName = (jid, withoutContact  = false) => {
        id = vajira.decodeJid(jid)
        withoutContact = vajira.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = vajira.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === vajira.decodeJid(vajira.user.id) ?
            vajira.user :
            (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }
    
    vajira.sendContact = async (jid, kon, quoted = '', opts = {}) => {
	let list = []
	for (let i of kon) {
	    list.push({
	    	displayName: await vajira.getName(i + '@s.whatsapp.net'),
	    	vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await vajira.getName(i + '@s.whatsapp.net')}\nFN:${await vajira.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Phone\nEND:VCARD`
	    })
	}
	vajira.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
    }
    
    vajira.public = true

    vajira.serializeM = (m) => smsg(vajira, m, store)

    vajira.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
        let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

        if (reason === DisconnectReason.badSession) {
            console.log(`Bad Session File, Please Delete Session and Scan Again`);
            vajira.logout();
        } else if (reason === DisconnectReason.connectionClosed) {
            console.log("Connection closed, reconnecting....");
            startvajira();
        } else if (reason === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server, reconnecting...");
            startvajira();
        } else if (reason === DisconnectReason.connectionReplaced) {
            console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First");
            vajira.logout();
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(`Device Logged Out, Please Scan Again And Run.`);
            vajira.logout();
        } else if (reason === DisconnectReason.restartRequired) {
            console.log("Restart Required, Restarting...");
            startvajira();
        } else if (reason === DisconnectReason.timedOut) {
            console.log("Connection TimedOut, Reconnecting...");
            startvajira();
        } else if (reason === DisconnectReason.Multidevicemismatch) {
            console.log("Multi device mismatch, please scan again");
            vajira.logout();
        } else {
            vajira.end(`Unknown DisconnectReason: ${reason}|${connection}`);
        }
    } else if (connection === "open") {
        // Add your custom message when the connection is open
        console.log('Connected...', update);
        vajira.sendMessage('94703475691@s.whatsapp.net', {
            text: `*hi bro! I'm QUEEN IZUMI MD 🫡*\n_👤 ＶＡＪＩＲＡ ＭＤ 👤 bot has successfully connected to the server\nNow enjoy the bot\n\n*OWNER NO :-* https://wa.me/94719199757\n*MY CHANNEL :-* https://youtube.com/@gamingewingyt6216?si=IHmBhi2R69ao6jcG_`
        })
    }
})


    vajira.ev.on('creds.update', saveCreds)



	

    // Add Other
      
      /**
     * 
     * @param {*} jid 
     * @param {*} name 
     * @param {*} values 
     * @returns 
     */
    vajira.sendPoll = (jid, name = '', values = [], selectableCount = 1) => { return vajira.sendMessage(jid, { poll: { name, values, selectableCount }}) }

      /**
      *
      * @param {*} jid
      * @param {*} url
      * @param {*} caption
      * @param {*} quoted
      * @param {*} options
      */
     vajira.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
      let mime = '';
      let res = await axios.head(url)
      mime = res.headers['content-type']
      if (mime.split("/")[1] === "gif") {
     return vajira.sendMessage(jid, { video: await getBuffer(url), caption: caption, gifPlayback: true, ...options}, { quoted: quoted, ...options})
      }
      let type = mime.split("/")[0]+"Message"
      if(mime === "application/pdf"){
     return vajira.sendMessage(jid, { document: await getBuffer(url), mimetype: 'application/pdf', caption: caption, ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "image"){
     return vajira.sendMessage(jid, { image: await getBuffer(url), caption: caption, ...options}, { quoted: quoted, ...options})
      }
      if(mime.split("/")[0] === "video"){
     return vajira.sendMessage(jid, { video: await getBuffer(url), caption: caption, mimetype: 'video/mp4', ...options}, { quoted: quoted, ...options })
      }
      if(mime.split("/")[0] === "audio"){
     return vajira.sendMessage(jid, { audio: await getBuffer(url), caption: caption, mimetype: 'audio/mpeg', ...options}, { quoted: quoted, ...options })
      }
    }

//============================================================================
  
         // Add Other
    /** Send Button 5 Image
     *
     * @param {*} jid
     * @param {*} text
     * @param {*} footer
     * @param {*} image
     * @param [*] button
     * @param {*} options
     * @returns
     */
    vajira.send5ButImg = async (jid , caption = '' , footer = '', img, but = [], options = {}) =>{
        let message = await prepareWAMessageMedia({ image: img }, { upload: vajira.waUploadToServer })
        var template = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
        templateMessage: {
        hydratedTemplate: {
        imageMessage: message.imageMessage,
               "hydratedContentText": caption,
               "hydratedFooterText": footer,
               "hydratedButtons": but
            }
            }
            }), options)
            vajira.relayMessage(jid, template.message, { messageId: template.key.id })
    }

    /**
     * 
     * @param {*} jid 
     * @param {*} buttons 
     * @param {*} caption 
     * @param {*} footer 
     * @param {*} quoted 
     * @param {*} options 
     */
    vajira.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
        let buttonMessage = {
            text,
            footer,
            buttons,
            headerType: 2,
            ...options
        }
        vajira.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    

    /**
     * 
     * @param {*} jid 
     * @param {*} image 
     * @param {*} buttons 
     * @param {*} caption 
     * @param {*} footer 
     * @param {*} quoted 
     * @param {*} options 
     */
    vajira.sendButtonImage = (jid, caption, footer, image, buttons = [], quoted = '', options = {}) => {
        let buttonMessage = {
            image,
            caption,
            footer,
            buttons,
            headerType: 2,
            ...options
        }
        vajira.sendMessage(jid, buttonMessage, { quoted, ...options })
    }
    /**
     * 
     * @param {*} jid 
     * @param {*} text 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendText = (jid, text, quoted = '', options) => vajira.sendMessage(jid, { text: text, ...options }, { quoted })

    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} caption 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendImage = async (jid, path, caption = '', quoted = '', options) => {
	let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await vajira.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
    }

    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} caption 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await vajira.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted })
    }

    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} quoted 
     * @param {*} mime 
     * @param {*} options 
     * @returns 
     */
    vajira.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await vajira.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted })
    }

    /**
     * 
     * @param {*} jid 
     * @param {*} text 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendTextWithMentions = async (jid, text, quoted, options = {}) => vajira.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }

        await vajira.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }

    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options)
        } else {
            buffer = await videoToWebp(buff)
        }

        await vajira.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
    }
    
	
    /**
     * 
     * @param {*} message 
     * @param {*} filename 
     * @param {*} attachExtension 
     * @returns 
     */
    vajira.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
	let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        // save to file
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    vajira.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
	}
        
	return buffer
     }



  vajira.sendListMsg = (
    jid,
    text = "",
    footer = "",
    title = "",
    butText = "",
    sects = [],
    quoted
  ) => {
    let sections = sects;
    var listMes = {
      text: text,
      footer: footer,
      title: title,
      buttonText: butText,
      sections,
    };
    vajira.sendMessage(jid, listMes, { quoted: quoted });
  };
	

  vajira.send5ButGif = async (
    jid,
    text = "",
    footer = "",
    gif,
    but = [],
    options = {}
  ) => {
    let message = await prepareWAMessageMedia(
      { video: gif, gifPlayback: true },
      { upload: vajira.waUploadToServer }
    );
    var template = generateWAMessageFromContent(
      jid,
      proto.Message.fromObject({
        templateMessage: {
          hydratedTemplate: {
            videoMessage: message.videoMessage,
            hydratedContentText: text,
            hydratedFooterText: footer,
            hydratedButtons: but,
          },
        },
      }),
      options
    );
    vajira.relayMessage(jid, template.message, { messageId: template.key.id });
  };

  vajira.send5ButVid = async (
    jid,
    text = "",
    footer = "",
    vid,
    but = [],
    options = {}
  ) => {
    let message = await prepareWAMessageMedia(
      { video: vid },
      { upload: vajira.waUploadToServer }
    );
    var template = generateWAMessageFromContent(
      jid,
      proto.Message.fromObject({
        templateMessage: {
          hydratedTemplate: {
            videoMessage: message.videoMessage,
            hydratedContentText: text,
            hydratedFooterText: footer,
            hydratedButtons: but,
          },
        },
      }),
      options
    );
    vajira.relayMessage(jid, template.message, { messageId: template.key.id });
  };
  //send5butmsg
  vajira.send5ButMsg = (jid, text = "", footer = "", but = []) => {
    let templateButtons = but;
    var templateMessage = {
      text: text,
      footer: footer,
      templateButtons: templateButtons,
    };
    vajira.sendMessage(jid, templateMessage);
  };

	
    /**
     * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} filename
     * @param {*} caption
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
    vajira.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await vajira.getFile(path, true)
           let { mime, ext, res, data, filename } = types
           if (res && res.status !== 200 || file.length <= 65536) {
               try { throw { json: JSON.parse(file.toString()) } }
               catch (e) { if (e.json) throw e.json }
           }
       let type = '', mimetype = mime, pathFile = filename
       if (options.asDocument) type = 'document'
       if (options.asSticker || /webp/.test(mime)) {
        let { writeExif } = require('./lib/exif')
        let media = { mimetype: mime, data }
        pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] })
        await fs.promises.unlink(filename)
        type = 'sticker'
        mimetype = 'image/webp'
        }
       else if (/image/.test(mime)) type = 'image'
       else if (/video/.test(mime)) type = 'video'
       else if (/audio/.test(mime)) type = 'audio'
       else type = 'document'
       await vajira.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options })
       return fs.promises.unlink(pathFile)
       }

    /**
     * 
     * @param {*} jid 
     * @param {*} message 
     * @param {*} forceForward 
     * @param {*} options 
     * @returns 
     */
    vajira.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype
		if (options.readViewOnce) {
			message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
			vtype = Object.keys(message.message.viewOnceMessage.message)[0]
			delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
			delete message.message.viewOnceMessage.message[vtype].viewOnce
			message.message = {
				...message.message.viewOnceMessage.message
			}
		}

        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
		let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
            ...context,
            ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo ? {
                contextInfo: {
                    ...content[ctype].contextInfo,
                    ...options.contextInfo
                }
            } : {})
        } : {})
        await vajira.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
        return waMessage
    }

    vajira.cMod = (jid, copy, text = '', sender = vajira.user.id, options = {}) => {
        //let copy = message.toJSON()
		let mtype = Object.keys(copy.message)[0]
		let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
		let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
		else if (content.caption) content.caption = text || content.caption
		else if (content.text) content.text = text || content.text
		if (typeof content !== 'string') msg[mtype] = {
			...content,
			...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
		else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
		copy.key.remoteJid = jid
		copy.key.fromMe = sender === vajira.user.id

        return proto.WebMessageInfo.fromObject(copy)
    }

    /**
     * 
     * @param {*} path 
     * @returns 
     */
    vajira.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        //if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
	    size: await getSizeMedia(data),
            ...type,
            data
        }

    }

    return vajira
}

startvajira()


let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})

