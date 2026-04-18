// src/utils/embeds.js
// Consistent embed styling for City of Tomorrow

const { EmbedBuilder } = require('discord.js');

const COLORS = {
  primary:  0x2ECC71,   // Green (main)
  success:  0x27AE60,   // Dark green
  error:    0xE74C3C,   // Red
  warning:  0xF39C12,   // Orange
  info:     0x3498DB,   // Blue
  purple:   0x9B59B6,   // Purple
  dark:     0x2C2F33,   // Dark grey
  arrest:   0xE74C3C,   // Red (arrests)
  donation: 0x2ECC71,   // Green (money)
  robbery:  0xFF6B35,   // Orange-red
  salary:   0x1ABC9C,   // Teal
};

const FOOTER = { text: 'City of Tomorrow', iconURL: null };

function base(color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTimestamp()
    .setFooter(FOOTER);
}

module.exports = {
  COLORS,

  success: (title, desc) => base(COLORS.success).setTitle(`✅ ${title}`).setDescription(desc),
  error:   (title, desc) => base(COLORS.error).setTitle(`❌ ${title}`).setDescription(desc),
  info:    (title, desc) => base(COLORS.info).setTitle(`ℹ️ ${title}`).setDescription(desc),
  warning: (title, desc) => base(COLORS.warning).setTitle(`⚠️ ${title}`).setDescription(desc),

  arrest: (data) => base(COLORS.arrest)
    .setTitle('🚔 New Arrest')
    .addFields(
      { name: 'Officer', value: data.officer || 'Unknown', inline: true },
      { name: 'Suspect', value: data.suspect || 'Unknown', inline: true },
      { name: 'Jail Time', value: (data.time || '0') + ' seconds', inline: true },
      { name: 'Charges', value: data.charges || 'Not specified' }
    ),

  donation: (data) => base(COLORS.donation)
    .setTitle('💸 Donation Logged')
    .addFields(
      { name: 'From', value: data.sender || 'Unknown', inline: true },
      { name: 'To', value: data.receiver || 'Unknown', inline: true },
      { name: 'Amount', value: `$${data.amount || 0}`, inline: true }
    ),

  robbery: (data) => base(COLORS.robbery)
    .setTitle('🏦 Robbery Event')
    .setDescription(data.message || 'A robbery is in progress.')
    .addFields(
      { name: 'Type', value: data.type || 'Unknown', inline: true },
      { name: 'Status', value: data.status || 'In Progress', inline: true }
    ),

  salary: (data) => base(COLORS.salary)
    .setTitle('💰 Payday')
    .setDescription(`**${data.player || 'A player'}** received their salary.`)
    .addFields(
      { name: 'Amount', value: `$${data.amount || 0}`, inline: true },
      { name: 'Team', value: data.team || 'Unknown', inline: true }
    ),

  custom: (color) => base(color),
  base,
};
