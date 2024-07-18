const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.Token);

bot.start((ctx) => ctx.reply('Welcome! 👋 I am a personal mega downloader bot!😇'));

bot.help((ctx) => ctx.reply('Use /start to start me, /help to see this message, or type something to talk to me!'));


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports=bot;