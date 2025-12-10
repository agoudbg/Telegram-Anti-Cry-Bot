import { Bot } from 'grammy';
import * as dotenv from 'dotenv';

dotenv.config();

const token = process.env.TOKEN;

if (!token) {
    throw new Error('TOKEN environment variable is not set');
}

const bot = new Bot(token);

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

bot.on('message', async (ctx) => {
    // stickers
    const sticker = ctx.message?.sticker;

    if (sticker) {
        const emoji = sticker.emoji;

        if (emoji && cryingEmojis.includes(emoji)) {
            await ctx.reply('请不要发送带有哭泣表情符号的贴纸。', {
                reply_parameters: { message_id: ctx.message.message_id }
            });
        }

        return;
    }

    // custom emojis
    const text = ctx.message?.text ?? ctx.message?.caption;
    const entities = ctx.message?.entities ?? ctx.message?.caption_entities;

    if (text && entities) {
        const emojis = entities.filter(entity => entity.type === 'custom_emoji');

        // check emoji in text
        for (const emoji of emojis) {
            const { offset, length } = emoji;
            const emojiText = text.substring(offset, offset + length);

            if (cryingEmojis.includes(emojiText)) {
                await ctx.reply('请不要发送带有哭泣表情符号的自定义表情符号。', {
                    reply_parameters: { message_id: ctx.message.message_id }
                });
                break;
            }
        }
    }
});

bot.start();
