const http = require('http');
http.createServer((req, res) => {
  res.write("Cryless Bot is Online!");
  res.end();
}).listen(process.env.PORT || 3000);
require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  PermissionsBitField,
  ChannelType
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

let lastNewsTitle = '';

client.once('ready', () => {
  console.log(`[${new Date().toLocaleTimeString()}] Cryless Bot is online as ${client.user.tag}!`);
  
  checkSiteNews();
  setInterval(checkSiteNews, 10 * 60 * 1000);
});

// ==========================================
// 1. MODRINTH API INTEGRATION
// ==========================================
async function getModrinthStats() {
  try {
    // Вказуємо slug моду
    const response = await fetch('https://api.modrinth.com/v2/project/cryless-visuals');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching Modrinth stats:', error);
    return null;
  }
}

// ==========================================
// 2. SITE NEWS AUTOMATIC TRACKER
// ==========================================
async function checkSiteNews() {
  try {
    const response = await fetch('https://cryless-visuals.netlify.app');
    const html = await response.text();

    const match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (match && match[1]) {
      const currentTitle = match[1].replace(/<[^>]+>/g, '').trim();

      if (lastNewsTitle && lastNewsTitle !== currentTitle) {
        const newsChannel = client.channels.cache.get(process.env.NEWS_CHANNEL_ID);
        if (newsChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📢 New Update Released!')
            .setDescription(`A new update is available on the website:\n\n**${currentTitle}**`)
            .setColor('#ff79c6')
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Read on Website')
              .setStyle(ButtonStyle.Link)
              .setURL('https://cryless-visuals.netlify.app')
          );

          await newsChannel.send({ embeds: [embed], components: [row] });
        }
      }
      lastNewsTitle = currentTitle;
    }
  } catch (error) {
    console.error('Error checking news:', error.message);
  }
}

// ==========================================
// 3. SLASH COMMANDS & INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async interaction => {
  // --- ОБРОБКА SLASH-КОМАНД ---
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === 'ping') {
      await interaction.reply({ content: `Pong! 🏓 Latency: ${client.ws.ping}ms`, ephemeral: true });
    } 
    
    else if (commandName === 'modinfo') {
      const embed = new EmbedBuilder()
        .setTitle('🌸 Cryless Visuals Mod')
        .setDescription('Enhance and customize your Minecraft visual experience.')
        .addFields(
          { name: 'Platform', value: 'Minecraft Fabric', inline: true },
          { name: 'Category', value: 'PvP / Visuals', inline: true },
          { name: 'Status', value: 'Active Development', inline: true }
        )
        .setColor('#ff79c6');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Official Website')
          .setStyle(ButtonStyle.Link)
          .setURL('https://cryless-visuals.netlify.app'),
        new ButtonBuilder()
          .setLabel('Download Mod')
          .setStyle(ButtonStyle.Link)
          .setURL('https://cryless-visuals.netlify.app#download')
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }

    else if (commandName === 'site') {
      await interaction.reply({ content: 'Official website: https://cryless-visuals.netlify.app' });
    }

    else if (commandName === 'stats') {
      await interaction.deferReply();
      const stats = await getModrinthStats();

      if (!stats) {
        return interaction.editReply({ content: 'Failed to fetch Modrinth statistics.' });
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${stats.title} Statistics`)
        .setDescription(stats.summary || 'Cryless Visuals Mod Stats')
        .addFields(
          { name: '📥 Downloads', value: `${stats.downloads.toLocaleString()}`, inline: true },
          { name: '⭐ Followers', value: `${stats.followers.toLocaleString()}`, inline: true },
          { name: '🛠️ Client Side', value: stats.client_side || 'required', inline: true }
        )
        .setColor('#50fa7b')
        .setThumbnail(stats.icon_url || null)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }

    else if (commandName === 'setup-tickets') {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: 'You need Administrator permissions to setup tickets!', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Support & Bug Reports')
        .setDescription('Click the button below to open a private support ticket for help or bug reporting.')
        .setColor('#bd93f9');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Create Ticket')
          .setEmoji('📩')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: 'Ticket panel has been created!', ephemeral: true });
    }
  }

  // --- ОБРОБКА КНОПОК ТИКЕТІВ ---
  else if (interaction.isButton()) {
    if (interaction.customId === 'create_ticket') {
      const guild = interaction.guild;
      const user = interaction.user;

      const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
      if (existingChannel) {
        return interaction.reply({ content: `You already have an open ticket: ${existingChannel}`, ephemeral: true });
      }

      // Створюємо приватний канал для тикета
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: user.id,
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
          },
        ],
      });

      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket: ${user.username}`)
        .setDescription('Thank you for contacting support! Please describe your issue or report the bug in detail.')
        .setColor('#ff79c6');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `${user}`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    else if (interaction.customId === 'close_ticket') {
      await interaction.reply({ content: 'Closing ticket in 5 seconds...' });
      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }
  }
});

// ==========================================
// 4. SERVER LOGGING SYSTEM
// ==========================================
client.on('guildMemberAdd', async member => {
  const logChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📥 Member Joined')
    .setDescription(`User **${member.user.tag}** (${member}) joined the server.`)
    .setColor('#50fa7b')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.on('guildMemberRemove', async member => {
  const logChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📤 Member Left')
    .setDescription(`User **${member.user.tag}** left the server.`)
    .setColor('#ff5555')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.on('messageDelete', async message => {
  if (message.partial || message.author?.bot) return;

  const logChannel = message.guild?.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message Deleted')
    .addFields(
      { name: 'Author', value: `${message.author.tag}`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Content', value: message.content || '*[No text content / Media]*', inline: false }
    )
    .setColor('#ffb86c')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.login(process.env.DISCORD_TOKEN);