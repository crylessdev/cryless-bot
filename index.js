require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`Cryless Bot успішно запущено як ${client.user.tag}!`);
});

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
        { name: 'Сайт', value: 'https://cryless-visuals.netlify.app', inline: false }
      )
      .setColor('#ff79c6');

    await interaction.reply({ embeds: [embed] });
  }

  else if (commandName === 'site') {
    await interaction.reply({ content: 'Офіційний сайт проєкту: https://cryless-visuals.netlify.app' });
  }
});

client.login(process.env.DISCORD_TOKEN);