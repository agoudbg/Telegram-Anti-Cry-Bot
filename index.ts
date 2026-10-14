import { Bot } from 'grammy';
import 'dotenv/config';
import { inspectMessage } from './tgcloud/lib/message-inspector.js';

const token = process.env.TOKEN;

if (!token) {
    throw new Error('TOKEN environment variable is not set');
}

const bot = new Bot(token);

bot.on('message', async (ctx) => {
    const warning = inspectMessage(ctx.message);

    if (warning) {
        await ctx.reply(warning.text, {
            reply_parameters: { message_id: ctx.message.message_id },
        });
    }
});

bot.start();
