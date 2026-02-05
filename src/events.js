const path = require('path');
const { EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');

  async function startARCEventNotifier(client, apiUrl) {
  let lastActiveMessage = null;
  const channel = await client.channels.fetch(process.env.CHANNEL_ARC)

  // Berechtigungen prüfen
  async function canSendMessages() {
  try {
  const me = await channel.guild.members.fetchMe(); // funktioniert ohne privilegierte Intents
  const perms = channel.permissionsFor(me);
  return perms.has(PermissionsBitField.Flags.SendMessages) &&
  perms.has(PermissionsBitField.Flags.EmbedLinks);
  } catch (err) {
  console.error(`[ARCEventNotifier] Fehler beim Prüfen der Berechtigungen:`, err);
  return false;
  }
  }

  // Sicher Nachrichten senden
  async function safeSend(content) {
  if (!await canSendMessages()) {
  console.log(`[ARCEventNotifier] Keine Berechtigung, Nachrichten/Embeds zu senden im Channel ${channel.name}`);
  return;
  }
  try {
  return await channel.send(content);
  } catch (err) {
  console.error(`[ARCEventNotifier] Fehler beim Senden:`, err);
  }
  }

  // Events von API holen
  async function fetchEvents() {
  const res = await fetch(apiUrl);
  const json = await res.json();
  const data = json.data || [];
  console.log(`[ARCEventNotifier] Gefundene Events: ${data.length}`);
  return data;
  }

async function postActiveEvents(channel) {
const events = await fetchEvents();
const now = new Date();


const activeEvents = events.flatMap(event =>
    (event.times || [])
        .map(time => {
            if (!time.start || !time.end) return null;

            const [startHour, startMinute] = time.start.split(':').map(Number);
            const [endHour, endMinute] = time.end.split(':').map(Number);

            // Aktuelles Datum (lokal)
            const localNow = new Date();

            // Wir erzeugen echte UTC-Dates passend zur API
            const startDate = new Date(Date.UTC(
                localNow.getUTCFullYear(),
                localNow.getUTCMonth(),
                localNow.getUTCDate(),
                startHour,
                startMinute,
                0,
                0
            ));

            let endDate = new Date(Date.UTC(
                localNow.getUTCFullYear(),
                localNow.getUTCMonth(),
                localNow.getUTCDate(),
                endHour === 24 ? 0 : endHour,
                endMinute,
                0,
                0
            ));

            // 24:00-Sonderfall → nächster Tag
            if (endHour === 24 && endMinute === 0) {
                endDate.setUTCDate(endDate.getUTCDate() + 1);
            }

            // Jetzt vergleichen wir sauber UTC mit UTC:
            const nowUTC = new Date();

            if (startDate <= nowUTC && endDate >= nowUTC) {
                return {
                    name: event.name,
                    map: event.map,
                    icon: event.icon,
                    start: startDate,
                    end: endDate
                };
            }
        })
        .filter(Boolean)
);

console.log(`[ARCEventNotifier] Aktive Events: ${activeEvents.map(e => e.name).join(', ') || 'Keine'}`);

if (activeEvents.length === 0) {
    if (lastActiveMessage) {
        try { await lastActiveMessage.delete(); } catch {}
        lastActiveMessage = null;
    }
    return;
}

// Footer-Icon lokal einbinden
const footerFileName = 'arc_raiders.jpg';
const footerPath = path.join(__dirname, 'images', footerFileName);
const footerAttachment = new AttachmentBuilder(footerPath, { name: footerFileName });

const embed = new EmbedBuilder()
    .setTitle("🟢 Aktive Events")
    .setColor(0x1ABC9C)
    .setTimestamp(now)
    .setFooter({ text: "Event-Timer", iconURL: `attachment://${footerFileName}` });

const attachments = [footerAttachment];

for (const ev of activeEvents) {
    const startStr = ev.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const endStr = ev.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Lokales Event-Thumbnail, falls kein URL-Icon vorhanden
    let thumbnailURL = ev.icon;
    if (!ev.icon) {
        const imageFileName = `${ev.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        const imagePath = path.join(__dirname, 'images', imageFileName);
        const eventAttachment = new AttachmentBuilder(imagePath, { name: imageFileName });
        attachments.push(eventAttachment);
        thumbnailURL = `attachment://${imageFileName}`;
    }

    embed.addFields({
        name: `⚔️ ${ev.name}`,
        value: `Map: **${ev.map}**\n🕒 ${startStr} - ${endStr}`,
        inline: true
    });

    // Thumbnail nur vom ersten Event, wenn es mehrere gibt
    if (!embed.thumbnail) {
        embed.setThumbnail(thumbnailURL);
    }
}

if (lastActiveMessage) {
    try {
        await lastActiveMessage.edit({ embeds: [embed], files: attachments });
    } catch (err) {
        console.error("[ARCEventNotifier] Fehler beim Editieren der Nachricht:", err);
        lastActiveMessage = await safeSend({ embeds: [embed], files: attachments });
    }
} else {
    lastActiveMessage = await safeSend({ embeds: [embed], files: attachments });
}

}

  async function scheduleActiveEventChecks(channel) {
const now = new Date();
const minutes = now.getMinutes();
const seconds = now.getSeconds();

// Sofort ausführen
await postActiveEvents(channel);

// Berechne Millisekunden bis zur nächsten 5-Minuten-Marke
const msUntilNext5 = ((5 - (minutes % 5)) * 60 - seconds) * 1000;

// Timer bis zur nächsten 5-Minuten-Marke
setTimeout(() => {
    postActiveEvents(channel); // erste 5-Minuten-Marke
    setInterval(() => {
        postActiveEvents(channel);
    }, 5 * 60 * 1000); // alle 5 Minuten
}, msUntilNext5);

}
  await scheduleActiveEventChecks();
  }

module.exports = { startARCEventNotifier };