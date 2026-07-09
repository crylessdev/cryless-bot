require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Перевірка затримки бота'),

  new SlashCommandBuilder()
    .setName('modinfo')
    .setDescription('Інформація про Cryless Visuals, версію та завантаження'),

  new SlashCommandBuilder()
    .setName('site')
    .setDescription('Посилання на офіційний сайт Cryless'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Оновлення slash-команд...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('Slash-команди успішно зареєстровано!');
  } catch (error) {
    console.error('Помилка реєстрації команд:', error);
  }
})();