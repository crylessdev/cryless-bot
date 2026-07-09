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
  console.log(`[${new Date().toLocaleTimeString()}] Cryless Bot успішно запущено як ${client.user.tag}!`);
  
  // Запускаємо перевірку новин кожні 10 хвилин
  checkSiteNews();
  setInterval(checkSiteNews, 10 * 60 * 1000);
});

// ==========================================
// 1. АВТОПАЗИНГ ТА ПУБЛІКАЦІЯ НОВИН
// ==========================================
async function checkSiteNews() {
  try {
    const response = await fetch('https://cryless-visuals.netlify.app');
    const html = await response.text();

    // Шукаємо заголовок або новину на сторінці
    const match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
    if (match && match[1]) {
      const currentTitle = match[1].replace(/<[^>]+>/g, '').trim();

      if (lastNewsTitle && lastNewsTitle !== currentTitle) {
        const newsChannel = client.channels.cache.get(process.env.NEWS_CHANNEL_ID);
        if (newsChannel) {
          const embed = new EmbedBuilder()
            .setTitle('📢 Нове оновлення на сайті!')
            .setDescription(`На сайті Cryless Visuals з'явилась нова інформація:\n\n**${currentTitle}**`)
            .setColor('#ff79c6')
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('Читати на сайті')
              .setStyle(ButtonStyle.Link)
              .setURL('https://cryless-visuals.netlify.app')
          );

          await newsChannel.send({ embeds: [embed], components: [row] });
        }
      }
      lastNewsTitle = currentTitle;
    }
  } catch (error) {
    console.error('Помилка перевірки новин:', error.message);
  }
}

// ==========================================
// 2. ОБРОБКА SLASH-КОМАНД ТА КНОПОК
// ==========================================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply({ content: `Pong! 🏓 Затримка: ${client.ws.ping}ms`, ephemeral: true });
  } 
  
  else if (commandName === 'modinfo') {
    const embed = new EmbedBuilder()
      .setTitle('🌸 Cryless Visuals Mod')
      .setDescription('Оптимізація та кастомізація візуалу Minecraft.')
      .addFields(
        { name: 'Платформа', value: 'Minecraft Fabric', inline: true },
        { name: 'Категорія', value: 'PvP / Visuals', inline: true },
        { name: 'Статус', value: 'Active Development', inline: true }
      )
      .setColor('#ff79c6');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Офіційний сайт')
        .setStyle(ButtonStyle.Link)
        .setURL('https://cryless-visuals.netlify.app'),
      new ButtonBuilder()
        .setLabel('Завантажити мод')
        .setStyle(ButtonStyle.Link)
        .setURL('https://cryless-visuals.netlify.app#download')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  else if (commandName === 'site') {
    await interaction.reply({ content: 'Офіційний сайт проєкту: https://cryless-visuals.netlify.app' });
  }
});

// ==========================================
// 3. СИСТЕМА ЛОГУВАННЯ ПОДІЙ СЕРВЕРА
// ==========================================
client.on('guildMemberAdd', async member => {
  const logChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📥 Новий учасник')
    .setDescription(`Користувач **${member.user.tag}** (${member}) приєднався до сервера.`)
    .setColor('#50fa7b')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.on('guildMemberRemove', async member => {
  const logChannel = member.guild.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('📤 Учасник покинув сервер')
    .setDescription(`Користувач **${member.user.tag}** покинув сервер.`)
    .setColor('#ff5555')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.on('messageDelete', async message => {
  if (message.partial || message.author?.bot) return;

  const logChannel = message.guild?.channels.cache.get(process.env.LOGS_CHANNEL_ID);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Повідомлення видалено')
    .addFields(
      { name: 'Автор', value: `${message.author.tag}`, inline: true },
      { name: 'Канал', value: `${message.channel}`, inline: true },
      { name: 'Вміст', value: message.content || '*[Без тексту / медіафайли]*', inline: false }
    )
    .setColor('#ffb86c')
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
});

client.login(process.env.DISCORD_TOKEN);