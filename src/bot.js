// src/bot.js
// City of Tomorrow — Discord Bot
// Main entry point

require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  Collection, REST, Routes, Events,
  EmbedBuilder, ActivityType
} = require('discord.js');
const express = require('express');
const path    = require('path');
const fs      = require('fs');
const emb     = require('./utils/embeds');

// ── Client Setup ─────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember]
});

client.commands = new Collection();

// ── Load Commands ─────────────────────────────────────────────────────────────
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const commands = require(`./commands/${file}`);
  for (const cmd of commands) {
    client.commands.set(cmd.data.name, cmd);
    console.log(`📋 Loaded command: /${cmd.data.name}`);
  }
}

// ── Ready Event ───────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async (c) => {
  console.log(`\n✅ City of Tomorrow Bot is online as: ${c.user.tag}`);
  console.log(`📊 Serving ${c.guilds.cache.size} server(s)`);

  // Set bot status
  c.user.setPresence({
    activities: [{ name: '🏙️ City of Tomorrow', type: ActivityType.Watching }],
    status: 'online',
  });

  // Deploy slash commands on startup
  await deployCommands(c);
});

// ── Auto-deploy Commands ──────────────────────────────────────────────────────
async function deployCommands(c) {
  const commandData = [...client.commands.values()].map(cmd => cmd.data.toJSON());
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    if (process.env.GUILD_ID && process.env.GUILD_ID !== 'YOUR_GUILD_ID_HERE') {
      // Deploy to specific guild (instant)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commandData }
      );
      console.log(`✅ Deployed ${commandData.length} slash commands to guild`);
    } else {
      // Deploy globally (takes up to 1 hour)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandData }
      );
      console.log(`✅ Deployed ${commandData.length} slash commands globally`);
    }
  } catch (err) {
    console.error('❌ Failed to deploy commands:', err.message);
  }
}

// ── Slash Command Handler ─────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error(`❌ Error in /${interaction.commandName}:`, err);
    const msg = { embeds: [emb.error('Error', 'An error occurred while running this command.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

// ── Auto-role on Member Join ──────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    // Auto-give Civilian role on join
    const civilianRole = member.guild.roles.cache.find(r => r.name === '🏠 Civilian');
    if (civilianRole) await member.roles.add(civilianRole);

    // Welcome message
    const welcomeChannel = member.guild.channels.cache.find(
      c => c.name.includes('general') || c.name.includes('welcome')
    );
    if (welcomeChannel) {
      await welcomeChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ECC71)
            .setTitle('👋 Welcome to City of Tomorrow!')
            .setDescription(
              `Welcome ${member.toString()}! 🎉\n\n` +
              `• Read the rules in <#rules>\n` +
              `• Join the Roblox group: [Click Here](https://www.roblox.com/share/g/34844395)\n` +
              `• Play the game and start your career!\n\n` +
              `You're member **#${member.guild.memberCount}**!`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
        ]
      });
    }
  } catch (err) {
    console.error('Join handler error:', err.message);
  }
});

// ── Log Moderation Actions ────────────────────────────────────────────────────
client.on(Events.GuildBanAdd, async (ban) => {
  const logChannel = ban.guild.channels.cache.find(c => c.name.includes('mod-log'));
  if (!logChannel) return;
  const audit = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(() => null);
  const entry = audit?.entries.first();
  logChannel.send({
    embeds: [emb.error('Member Banned',
      `**User:** ${ban.user.tag} (${ban.user.id})\n**Reason:** ${entry?.reason || 'No reason provided'}\n**By:** ${entry?.executor?.tag || 'Unknown'}`
    )]
  }).catch(() => {});
});

client.on(Events.GuildBanRemove, async (ban) => {
  const logChannel = ban.guild.channels.cache.find(c => c.name.includes('mod-log'));
  if (!logChannel) return;
  logChannel.send({
    embeds: [emb.success('Member Unbanned', `**User:** ${ban.user.tag} (${ban.user.id})`)]
  }).catch(() => {});
});

// ── Express Webhook Listener (receives Roblox game events) ───────────────────
const app = express();
app.use(express.json());

app.post('/game-event', async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately

  const { type, data, guildId } = req.body;
  if (!type || !data) return;

  const guild = client.guilds.cache.get(guildId || process.env.GUILD_ID);
  if (!guild) return;

  const channelMap = {
    arrest:   '🚔・arrest-logs',
    donation: '💸・donation-logs',
    robbery:  '🏦・robbery-logs',
    salary:   '💰・salary-logs',
  };

  const channelName = channelMap[type];
  if (!channelName) return;

  const channel = guild.channels.cache.find(c => c.name === channelName);
  if (!channel) return;

  let embed;
  if (type === 'arrest')   embed = emb.arrest(data);
  if (type === 'donation') embed = emb.donation(data);
  if (type === 'robbery')  embed = emb.robbery(data);
  if (type === 'salary')   embed = emb.salary(data);

  if (embed) channel.send({ embeds: [embed] }).catch(() => {});
});

app.get('/health', (_, res) => res.json({ status: 'ok', bot: client.user?.tag }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Webhook listener running on port ${process.env.PORT || 3000}`);
});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Failed to login:', err.message);
  process.exit(1);
});
