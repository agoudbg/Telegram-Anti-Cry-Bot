import { api } from 'sdk';

import { inspectMessage, type TelegramMessage } from '../lib/message-inspector.js';

export default async function handleMessage(message: TelegramMessage): Promise<void> {
    const warning = inspectMessage(message);

    if (!warning) {
        return;
    }

    await api.sendMessage({
        chat_id: message.chat.id,
        text: warning.text,
        reply_parameters: {
            message_id: message.message_id,
        },
    });
}
