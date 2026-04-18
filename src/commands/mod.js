// src/commands/mod.js
// Moderation commands: kick, ban, unban, warn, mute, unmute, warnings, purge

const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder
} = require('discord.js');
const db  = require('../utils/database');
const emb = require('../utils/embeds');
const ms  = require('ms');

const OWNER_ID = '3306953640'; // Devilish_altig Roblox ID (kept for reference)

module.exports = [

  // ── KICK ─────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server')
      .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ embeds: [emb.error('Not Found', 'User not in server.')], ephemeral: true });
      if (!target.kickable) return interaction.reply({ embeds: [emb.error('Cannot Kick', 'I cannot kick this user.')], ephemeral: true });

      await target.kick(reason);
      await interaction.reply({
        embeds: [emb.success('Member Kicked',
          `**${target.user.tag}** has been kicked.\n**Reason:** ${reason}`)]
      });
    }
  },

  // ── BAN ──────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a user from the server')
      .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
      const user   = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const days   = interaction.options.getInteger('delete_days') ?? 0;
      try {
        await interaction.guild.members.ban(user, { reason, deleteMessageDays: days });
        await interaction.reply({
          embeds: [emb.success('User Banned',
            `**${user.tag}** has been banned.\n**Reason:** ${reason}`)]
        });
      } catch {
        await interaction.reply({ embeds: [emb.error('Cannot Ban', 'Failed to ban this user.')], ephemeral: true });
      }
    }
  },

  // ── UNBAN ────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user by ID')
      .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
      const userId = interaction.options.getString('user_id');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      try {
        await interaction.guild.members.unban(userId, reason);
        await interaction.reply({ embeds: [emb.success('User Unbanned', `<@${userId}> has been unbanned.\n**Reason:** ${reason}`)] });
      } catch {
        await interaction.reply({ embeds: [emb.error('Cannot Unban', 'User not found in ban list.')], ephemeral: true });
      }
    }
  },

  // ── WARN ─────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a member')
      .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason');
      if (!target) return interaction.reply({ embeds: [emb.error('Not Found', 'User not in server.')], ephemeral: true });

      db.addWarning(target.id, reason, interaction.user.id, interaction.user.tag);
      const warns = db.getWarnings(target.id);

      // DM the user
      try {
        await target.send({
          embeds: [emb.warning('You have been warned',
            `**Server:** ${interaction.guild.name}\n**Reason:** ${reason}\n**Total warnings:** ${warns.length}`)]
        });
      } catch { /* Can't DM */ }

      await interaction.reply({
        embeds: [emb.warning('Member Warned',
          `**${target.user.tag}** has been warned.\n**Reason:** ${reason}\n**Total warnings:** ${warns.length}`)]
      });
    }
  },

  // ── WARNINGS ─────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('View warnings for a user')
      .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
      const target = interaction.options.getUser('user');
      const warns  = db.getWarnings(target.id);

      if (warns.length === 0) {
        return interaction.reply({ embeds: [emb.info('No Warnings', `**${target.tag}** has no warnings.`)] });
      }

      const embed = emb.warning(`Warnings — ${target.tag}`, `**${warns.length}** warning(s) on record.`);
      warns.slice(0, 10).forEach((w, i) => {
        embed.addFields({
          name: `#${i + 1} — ${new Date(w.created_at * 1000).toLocaleDateString()}`,
          value: `${w.reason}\n*by ${w.moderator_name}*`
        });
      });
      await interaction.reply({ embeds: [embed] });
    }
  },

  // ── CLEAR WARNINGS ───────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('clearwarnings')
      .setDescription('Clear all warnings for a user')
      .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      const target = interaction.options.getUser('user');
      db.clearWarnings(target.id);
      await interaction.reply({ embeds: [emb.success('Warnings Cleared', `All warnings cleared for **${target.tag}**.`)] });
    }
  },

  // ── MUTE (timeout) ───────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Timeout (mute) a member')
      .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
      .addStringOption(o => o.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
      const target   = interaction.options.getMember('user');
      const duration = interaction.options.getString('duration');
      const reason   = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ embeds: [emb.error('Not Found', 'User not in server.')], ephemeral: true });

      const msTime = ms(duration);
      if (!msTime || msTime > ms('28d')) {
        return interaction.reply({ embeds: [emb.error('Invalid Duration', 'Use format like `10m`, `1h`, `1d`. Max 28 days.')], ephemeral: true });
      }

      await target.timeout(msTime, reason);
      await interaction.reply({
        embeds: [emb.warning('Member Muted',
          `**${target.user.tag}** has been muted for **${duration}**.\n**Reason:** ${reason}`)]
      });
    }
  },

  // ── UNMUTE ───────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Remove timeout from a member')
      .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
      const target = interaction.options.getMember('user');
      if (!target) return interaction.reply({ embeds: [emb.error('Not Found', 'User not in server.')], ephemeral: true });
      await target.timeout(null);
      await interaction.reply({ embeds: [emb.success('Member Unmuted', `**${target.user.tag}** has been unmuted.`)] });
    }
  },

  // ── PURGE ────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Delete bulk messages')
      .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
      .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
      const amount = interaction.options.getInteger('amount');
      const target = interaction.options.getUser('user');
      await interaction.deferReply({ ephemeral: true });

      const messages = await interaction.channel.messages.fetch({ limit: amount });
      const toDelete = target ? messages.filter(m => m.author.id === target.id) : messages;
      const deleted  = await interaction.channel.bulkDelete(toDelete, true);

      await interaction.editReply({ embeds: [emb.success('Messages Deleted', `Deleted **${deleted.size}** message(s).`)] });
    }
  },

  // ── SLOWMODE ─────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('slowmode')
      .setDescription('Set channel slowmode')
      .addIntegerOption(o => o.setName('seconds').setDescription('Slowmode in seconds (0 to disable)').setMinValue(0).setMaxValue(21600).setRequired(true))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
      const seconds = interaction.options.getInteger('seconds');
      await interaction.channel.setRateLimitPerUser(seconds);
      const msg = seconds === 0 ? 'Slowmode disabled.' : `Slowmode set to **${seconds}s**.`;
      await interaction.reply({ embeds: [emb.success('Slowmode Updated', msg)] });
    }
  },

  // ── LOCK / UNLOCK ────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName('lock')
      .setDescription('Lock or unlock a channel')
      .addStringOption(o => o.setName('action').setDescription('lock or unlock').addChoices(
        { name: 'Lock', value: 'lock' },
        { name: 'Unlock', value: 'unlock' }
      ).setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(false))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
      const action = interaction.options.getString('action');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const perms  = action === 'lock' ? false : null;

      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: perms
      });

      await interaction.reply({
        embeds: [action === 'lock'
          ? emb.error('Channel Locked', `This channel has been locked.\n**Reason:** ${reason}`)
          : emb.success('Channel Unlocked', `This channel has been unlocked.\n**Reason:** ${reason}`)]
      });
    }
  },
];
