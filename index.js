require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
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
// 1. SITE NEWS AUTOMATIC TRACKER
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
// 2. SLASH COMMANDS & BUTTONS HANDLER
// ==========================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

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
});

// ==========================================
// 3. SERVER LOGGING SYSTEM
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