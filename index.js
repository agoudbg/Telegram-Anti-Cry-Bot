const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TOKEN;

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
  // stickers
  const { sticker } = msg;

  if (sticker) {
    const { emoji } = sticker;

    if (cryingEmojis.includes(emoji)) {
      bot.sendMessage(msg.chat.id, '请不要发送带有哭泣表情符号的贴纸。', { reply_to_message_id: msg.message_id });
    }

    return;
  }

  // custom emojis
  const text = msg.text ?? msg.caption;
  const entities = msg.entities ?? msg.caption_entities;

  if (text && entities) {
    const emojis = entities.filter(entity => entity.type === 'custom_emoji');

    // check emoji in text
    emojis.every(emoji => {
      const { offset, length } = emoji;
      const emojiText = text.substring(offset, offset + length);

      if (cryingEmojis.includes(emojiText)) {
        bot.sendMessage(msg.chat.id, '请不要发送带有哭泣表情符号的自定义表情符号。', { reply_to_message_id: msg.message_id });
        return false;
      }
    });
  }
});
