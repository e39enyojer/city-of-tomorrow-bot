// src/commands/setup.js
// One-command Discord server setup for City of Tomorrow RP game

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const emb = require('../utils/embeds');

// ── Server Structure ────────────────────────────────────────────────────────
const ROLES = [
  // Staff roles (created first, highest perms)
  { name: '👑 Owner',           color: '#FFD700', hoist: true, position: 'top', admin: true },
  { name: '🛡️ Co-Owner',        color: '#FF6B35', hoist: true, admin: true },
  { name: '💻 Developer',       color: '#9B59B6', hoist: true },
  { name: '⚡ Administrator',   color: '#E74C3C', hoist: true },
  { name: '🔨 Moderator',       color: '#E67E22', hoist: true },
  { name: '🤝 Helper',          color: '#F1C40F', hoist: true },
  // Game department roles
  { name: '🚔 State Patrol',    color: '#2980B9', hoist: false },
  { name: '🚨 Sheriff\'s Office', color: '#1F618D', hoist: false },
  { name: '🚓 City Police',     color: '#154360', hoist: false },
  { name: '🔥 Fire Department', color: '#C0392B', hoist: false },
  { name: '⚕️ Health Department', color: '#27AE60', hoist: false },
  { name: '⚖️ Department of Justice', color: '#7D3C98', hoist: false },
  { name: '🏛️ Government',     color: '#2E86C1', hoist: false },
  { name: '🚌 Transportation',  color: '#F39C12', hoist: false },
  { name: '🌲 Park Service',   color: '#1E8449', hoist: false },
  { name: '🔧 Public Works',   color: '#884EA0', hoist: false },
  { name: '✈️ Aviation',       color: '#17A589', hoist: false },
  { name: '⚓ Coast Guard',     color: '#2E86C1', hoist: false },
  { name: '🏦 Corrections',    color: '#717D7E', hoist: false },
  { name: '🔒 FBI',            color: '#1A5276', hoist: false },
  { name: '🏠 Civilian',       color: '#85929E', hoist: false },
  // Special roles
  { name: '🚀 Server Booster', color: '#FF73FA', hoist: true },
  { name: '✅ Verified',        color: '#2ECC71', hoist: false },
  { name: '🔔 Notifications',  color: '#95A5A6', hoist: false },
  { name: '🤖 Bot',            color: '#7289DA', hoist: false },
];

const CATEGORIES = [
  {
    name: '📢 INFORMATION',
    channels: [
      { name: '📋・rules',          type: ChannelType.GuildText, topic: 'Server rules and guidelines' },
      { name: '📣・announcements',  type: ChannelType.GuildText, topic: 'Official server and game announcements', lockSend: true },
      { name: '📝・patch-notes',   type: ChannelType.GuildText, topic: 'Game update patch notes', lockSend: true },
      { name: '🎭・roles-info',     type: ChannelType.GuildText, topic: 'Information about server roles', lockSend: true },
      { name: '❓・faq',            type: ChannelType.GuildText, topic: 'Frequently asked questions', lockSend: true },
    ]
  },
  {
    name: '💬 COMMUNITY',
    channels: [
      { name: '👋・introductions',  type: ChannelType.GuildText, topic: 'Introduce yourself to the community' },
      { name: '💬・general',        type: ChannelType.GuildText, topic: 'General chat for everyone' },
      { name: '🗺️・off-topic',     type: ChannelType.GuildText, topic: 'Off-topic discussion' },
      { name: '😂・memes',         type: ChannelType.GuildText, topic: 'Memes and fun content' },
      { name: '📸・media',         type: ChannelType.GuildText, topic: 'Screenshots and videos from the game' },
    ]
  },
  {
    name: '🎮 GAME',
    channels: [
      { name: '🎮・game-chat',     type: ChannelType.GuildText, topic: 'In-game discussion' },
      { name: '💡・suggestions',   type: ChannelType.GuildText, topic: 'Suggest new features or improvements' },
      { name: '🐛・bug-reports',   type: ChannelType.GuildText, topic: 'Report bugs and issues' },
      { name: '🚔・roleplay',      type: ChannelType.GuildText, topic: 'Roleplay planning and discussion' },
      { name: '🏆・leaderboards',  type: ChannelType.GuildText, topic: 'Game leaderboards and stats', lockSend: true },
    ]
  },
  {
    name: '📊 GAME LOGS',
    channels: [
      { name: '🚔・arrest-logs',   type: ChannelType.GuildText, topic: 'In-game arrest log feed', lockSend: true },
      { name: '💸・donation-logs', type: ChannelType.GuildText, topic: 'In-game donation log feed', lockSend: true },
      { name: '🏦・robbery-logs',  type: ChannelType.GuildText, topic: 'Bank and store robbery log feed', lockSend: true },
      { name: '💰・salary-logs',   type: ChannelType.GuildText, topic: 'Salary payment log feed', lockSend: true },
      { name: '🔫・license-logs',  type: ChannelType.GuildText, topic: 'Gun license grant/revoke log', lockSend: true },
    ]
  },
  {
    name: '🎫 SUPPORT',
    channels: [
      { name: '📨・get-support',   type: ChannelType.GuildText, topic: 'Open a support ticket here' },
      { name: '🔊・staff-support', type: ChannelType.GuildVoice, topic: 'Staff support voice channel' },
    ]
  },
  {
    name: '🔒 STAFF ONLY',
    staffOnly: true,
    channels: [
      { name: '💬・staff-chat',    type: ChannelType.GuildText, topic: 'Staff discussion' },
      { name: '📋・staff-commands',type: ChannelType.GuildText, topic: 'Bot commands for staff' },
      { name: '📜・mod-log',       type: ChannelType.GuildText, topic: 'Moderation action log', lockSend: true },
      { name: '📊・admin-log',     type: ChannelType.GuildText, topic: 'Admin action log', lockSend: true },
      { name: '🤫・dev-chat',      type: ChannelType.GuildText, topic: 'Developer discussion' },
    ]
  },
  {
    name: '🔊 VOICE CHANNELS',
    channels: [
      { name: '📢 Announcements',  type: ChannelType.GuildVoice },
      { name: '🎮 General VC',     type: ChannelType.GuildVoice },
      { name: '🚔 Law Enforcement',type: ChannelType.GuildVoice },
      { name: '🔥 Fire & EMS',    type: ChannelType.GuildVoice },
      { name: '🏛️ Government',    type: ChannelType.GuildVoice },
      { name: '🎵 Music',         type: ChannelType.GuildVoice },
    ]
  }
];

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('setup-server')
      .setDescription('[OWNER ONLY] Set up all server channels, roles, and permissions from scratch')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      // Only owner can run this
      if (interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({ embeds: [emb.error('Access Denied', 'Only the server owner can run this command.')], ephemeral: true });
      }

      await interaction.reply({ embeds: [emb.info('Setting Up Server', '⏳ Creating roles, channels, and permissions...\nThis may take a minute.')], ephemeral: true });

      const guild = interaction.guild;
      const created = { roles: 0, channels: 0, categories: 0 };
      const roleMap  = new Map();

      // ── Create Roles ────────────────────────────────────
      for (const roleDef of ROLES) {
        try {
          const existing = guild.roles.cache.find(r => r.name === roleDef.name);
          if (existing) { roleMap.set(roleDef.name, existing); continue; }

          const role = await guild.roles.create({
            name:        roleDef.name,
            color:       roleDef.color,
            hoist:       roleDef.hoist || false,
            mentionable: true,
            permissions: roleDef.admin ? [PermissionFlagsBits.Administrator] : [],
          });
          roleMap.set(roleDef.name, role);
          created.roles++;
        } catch (e) {
          console.error(`Failed to create role ${roleDef.name}:`, e.message);
        }
      }

      // Give owner the Owner role
      try {
        const ownerRole = roleMap.get('👑 Owner');
        if (ownerRole) await interaction.member.roles.add(ownerRole);
      } catch {}

      // Get staff roles for permission overwrites
      const staffRoles = ['👑 Owner', '🛡️ Co-Owner', '💻 Developer', '⚡ Administrator', '🔨 Moderator']
        .map(n => roleMap.get(n)).filter(Boolean);

      // ── Create Categories and Channels ──────────────────
      for (const catDef of CATEGORIES) {
        try {
          const existing = guild.channels.cache.find(c => c.name === catDef.name && c.type === ChannelType.GuildCategory);
          let category = existing;

          if (!category) {
            const permOverwrites = [];
            if (catDef.staffOnly) {
              // Hide from everyone, show for staff
              permOverwrites.push({
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel]
              });
              for (const role of staffRoles) {
                permOverwrites.push({ id: role, allow: [PermissionFlagsBits.ViewChannel] });
              }
            }

            category = await guild.channels.create({
              name: catDef.name,
              type: ChannelType.GuildCategory,
              permissionOverwrites: permOverwrites
            });
            created.categories++;
          }

          for (const chDef of catDef.channels) {
            const existingCh = guild.channels.cache.find(c => c.name === chDef.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || c.name === chDef.name);
            if (existingCh) continue;

            const chPerms = [];
            if (chDef.lockSend) {
              chPerms.push({ id: guild.roles.everyone, deny: [PermissionFlagsBits.SendMessages] });
            }
            if (catDef.staffOnly) {
              chPerms.push({ id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] });
              for (const role of staffRoles) {
                chPerms.push({ id: role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] });
              }
            }

            await guild.channels.create({
              name:                chDef.name,
              type:                chDef.type,
              parent:              category,
              topic:               chDef.topic || '',
              permissionOverwrites: chPerms,
            });
            created.channels++;
            await new Promise(r => setTimeout(r, 300)); // Rate limit safety
          }
        } catch (e) {
          console.error(`Failed to create category ${catDef.name}:`, e.message);
        }
      }

      // ── Update rules channel with welcome message ────────
      const rulesChannel = guild.channels.cache.find(c => c.name.includes('rules'));
      if (rulesChannel) {
        await rulesChannel.send({
          embeds: [emb.info('📋 Server Rules — City of Tomorrow',
            '**1.** Be respectful to all members.\n' +
            '**2.** No harassment, hate speech, or discrimination.\n' +
            '**3.** No spamming or flooding channels.\n' +
            '**4.** Keep content appropriate for all ages.\n' +
            '**5.** No advertising other servers or games.\n' +
            '**6.** Follow all Discord Terms of Service.\n' +
            '**7.** In-game rules apply — no exploiting, hacking, or exploiting bugs.\n' +
            '**8.** Listen to staff members at all times.\n\n' +
            '*Breaking rules may result in a warning, mute, kick, or ban.*'
          )
        ]).catch(() => {});
      }

      // Final report
      await interaction.editReply({
        embeds: [emb.success('Server Setup Complete! 🎉',
          `✅ **${created.roles}** roles created\n` +
          `✅ **${created.categories}** categories created\n` +
          `✅ **${created.channels}** channels created\n\n` +
          `Your server is ready! You still need to:\n` +
          `• Set up your webhook URLs in each log channel\n` +
          `• Configure your verification system\n` +
          `• Assign department roles to your staff`
        )]
      });
    }
  }
];
