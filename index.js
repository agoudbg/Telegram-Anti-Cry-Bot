const TelegramBot = require('node-telegram-bot-api');

const token = 'xxxxxxxx:xxxxxxxxxxxxxxxxxx';
const bot = new TelegramBot(token, { polling: true });

const cryingEmojis = [
  '😢',
  '😭',
  '😥',
  '😰',
  '😔',
  '😟',
  '😞',
  '😖',
  '😣',
  '😥',
  '🥺',
  '😫',
  '😩',
  '😿',
];

bot.on('message', msg => {
  const { sticker } = msg;

  if (!sticker) {
    return;
  }

  const { emoji } = sticker;

  if (cryingEmojis.includes(emoji)) {
    bot.sendMessage(msg.chat.id, '请不要发送带有哭泣表情符号的贴纸。', { reply_to_message_id: msg.message_id });
  }
});
