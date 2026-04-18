// src/commands/game.js
// Roblox game integration: gun licenses, boosters, announcements, player lookup

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db  = require('../utils/database');
const emb = require('../utils/embeds');

module.exports = [

  // ── GUN LICENSE GRANT ────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('license-grant')
      .setDescription('[STAFF] Grant a firearms license to a Roblox player')
      .addIntegerOption(o => o.setName('roblox_id').setDescription('Player Roblox User ID').setRequired(true))
      .addStringOption(o => o.setName('roblox_name').setDescription('Player Roblox username').setRequired(true))
      .addUserOption(o => o.setName('discord').setDescription('Their Discord account (optional)').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const robloxId   = interaction.options.getInteger('roblox_id');
      const robloxName = interaction.options.getString('roblox_name');
      const discordUser = interaction.options.getUser('discord');

      db.grantLicense(robloxId, robloxName, discordUser?.id, interaction.user.tag);

      const embed = emb.success('Gun License Granted',
        `**Roblox:** ${robloxName} (${robloxId})\n` +
        `**Discord:** ${discordUser ? discordUser.toString() : 'Not linked'}\n` +
        `**Granted by:** ${interaction.user.tag}`
      );

      await interaction.reply({ embeds: [embed] });

      // Post to log channel if configured
      const logChannel = interaction.guild.channels.cache.find(c => c.name === 'gun-license-logs');
      if (logChannel) await logChannel.send({ embeds: [embed] });
    }
  },

  // ── GUN LICENSE REVOKE ───────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('license-revoke')
      .setDescription('[STAFF] Revoke a firearms license')
      .addIntegerOption(o => o.setName('roblox_id').setDescription('Player Roblox User ID').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const robloxId = interaction.options.getInteger('roblox_id');
      const had = db.hasLicense(robloxId);
      if (!had) return interaction.reply({ embeds: [emb.error('No License', `Roblox ID **${robloxId}** does not have a license.`)], ephemeral: true });

      db.revokeLicense(robloxId);
      await interaction.reply({ embeds: [emb.success('License Revoked', `Firearms license for Roblox ID **${robloxId}** has been revoked.`)] });
    }
  },

  // ── LICENSE LIST ─────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('license-list')
      .setDescription('View all active gun licenses')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const licenses = db.getAllLicenses();
      if (licenses.length === 0) return interaction.reply({ embeds: [emb.info('No Licenses', 'No gun licenses on record.')], ephemeral: true });

      const embed = emb.info('Active Gun Licenses', `**${licenses.length}** license(s) on record.`);
      const display = licenses.slice(0, 15);
      embed.setDescription(
        display.map((l, i) => `**${i+1}.** ${l.roblox_name} (${l.roblox_id}) — *granted by ${l.granted_by}*`).join('\n')
        + (licenses.length > 15 ? `\n\n*...and ${licenses.length - 15} more*` : '')
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // ── LICENSE CHECK ────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('license-check')
      .setDescription('Check if a Roblox player has a gun license')
      .addIntegerOption(o => o.setName('roblox_id').setDescription('Roblox User ID').setRequired(true)),

    async execute(interaction) {
      const robloxId = interaction.options.getInteger('roblox_id');
      const has = db.hasLicense(robloxId);
      await interaction.reply({
        embeds: [has
          ? emb.success('License Found', `Roblox ID **${robloxId}** has a valid firearms license.`)
          : emb.error('No License', `Roblox ID **${robloxId}** does not have a firearms license.`)
        ],
        ephemeral: true
      });
    }
  },

  // ── BOOSTER ADD ──────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('booster-add')
      .setDescription('[STAFF] Add a player as a game booster (+$12/pay cycle)')
      .addUserOption(o => o.setName('discord').setDescription('Discord user').setRequired(true))
      .addIntegerOption(o => o.setName('roblox_id').setDescription('Their Roblox User ID').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const target   = interaction.options.getUser('discord');
      const robloxId = interaction.options.getInteger('roblox_id');

      db.addBooster(target.id, target.tag, robloxId, interaction.user.tag);

      await interaction.reply({
        embeds: [emb.success('Booster Added',
          `${target.toString()} is now a **City of Tomorrow Booster** 🚀\n` +
          `They will receive **+$12 per pay cycle** in-game.\n` +
          (robloxId ? `**Roblox ID:** ${robloxId}` : '*No Roblox ID linked*')
        )]
      });

      // Give booster role
      const boosterRole = interaction.guild.roles.cache.find(r => r.name === '🚀 Server Booster');
      if (boosterRole) {
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member) await member.roles.add(boosterRole).catch(() => {});
      }
    }
  },

  // ── BOOSTER REMOVE ───────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('booster-remove')
      .setDescription('[STAFF] Remove a player from booster list')
      .addUserOption(o => o.setName('discord').setDescription('Discord user').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const target = interaction.options.getUser('discord');
      db.removeBooster(target.id);

      await interaction.reply({ embeds: [emb.success('Booster Removed', `${target.toString()} has been removed from the booster list.`)] });

      const boosterRole = interaction.guild.roles.cache.find(r => r.name === '🚀 Server Booster');
      if (boosterRole) {
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (member) await member.roles.remove(boosterRole).catch(() => {});
      }
    }
  },

  // ── BOOSTER LIST ─────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('booster-list')
      .setDescription('View all active game boosters')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const boosters = db.getAllBoosters();
      if (boosters.length === 0) return interaction.reply({ embeds: [emb.info('No Boosters', 'No boosters on record.')], ephemeral: true });

      const embed = emb.info('Game Boosters 🚀', `**${boosters.length}** active booster(s).`);
      embed.setDescription(
        boosters.map((b, i) =>
          `**${i+1}.** <@${b.user_id}> ${b.roblox_id ? `(Roblox: ${b.roblox_id})` : ''}`
        ).join('\n')
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // ── GAME ANNOUNCE ────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('announce')
      .setDescription('[STAFF] Post a game announcement')
      .addStringOption(o => o.setName('title').setDescription('Announcement title').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Announcement message').setRequired(true))
      .addStringOption(o => o.setName('type').setDescription('Type').addChoices(
        { name: '📢 General', value: 'general' },
        { name: '🎮 Game Update', value: 'update' },
        { name: '🚨 Emergency', value: 'emergency' },
        { name: '🎉 Event', value: 'event' },
      ).setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const title   = interaction.options.getString('title');
      const message = interaction.options.getString('message');
      const type    = interaction.options.getString('type') || 'general';

      const colors = { general: 0x3498DB, update: 0x2ECC71, emergency: 0xE74C3C, event: 0x9B59B6 };
      const icons  = { general: '📢', update: '🎮', emergency: '🚨', event: '🎉' };

      const embed = emb.custom(colors[type])
        .setTitle(`${icons[type]} ${title}`)
        .setDescription(message)
        .setFooter({ text: `Announced by ${interaction.user.tag}` });

      // Post to announcements channel
      const announceChannel = interaction.guild.channels.cache.find(
        c => c.name === 'announcements' || c.name === '📢・announcements'
      );

      if (announceChannel) {
        await announceChannel.send({ content: '<@&everyone>', embeds: [embed] });
        await interaction.reply({ embeds: [emb.success('Announced!', `Your announcement has been posted in ${announceChannel.toString()}`)], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [embed] });
      }
    }
  },

  // ── SERVERINFO ───────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('View City of Tomorrow server information'),

    async execute(interaction) {
      const guild = interaction.guild;
      const embed = emb.info('City of Tomorrow', guild.description || 'Welcome to City of Tomorrow!')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '👥 Members', value: guild.memberCount.toString(), inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '🌍 Region', value: guild.preferredLocale || 'Unknown', inline: true },
          { name: '🎮 Roblox Group', value: '[City of Tomorrow](https://www.roblox.com/share/g/34844395)', inline: true },
          { name: '🚀 Boosters', value: db.getAllBoosters().length.toString(), inline: true },
          { name: '🔫 Gun Licenses', value: db.getAllLicenses().length.toString(), inline: true },
        );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // ── USERINFO ─────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('View information about a user')
      .addUserOption(o => o.setName('user').setDescription('User to look up').setRequired(false)),

    async execute(interaction) {
      const target = interaction.options.getMember('user') || interaction.member;
      const user   = target.user;
      const warns  = db.getWarnings(user.id);
      const booster = db.isBooster(user.id);

      const embed = emb.info(user.tag, '')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '📅 Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`, inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '⚠️ Warnings', value: warns.length.toString(), inline: true },
          { name: '🚀 Booster', value: booster ? 'Yes' : 'No', inline: true },
          { name: '🎭 Roles', value: target.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'None' }
        );
      await interaction.reply({ embeds: [embed] });
    }
  },
];
