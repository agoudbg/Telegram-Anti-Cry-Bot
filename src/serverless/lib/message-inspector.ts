export interface MessageEntity {
    type: string;
    offset: number;
    length: number;
}

export interface TelegramMessage {
    chat: {
        id: number;
    };
    message_id: number;
    sticker?: {
        emoji?: string;
    };
    text?: string;
    caption?: string;
    entities?: MessageEntity[];
    caption_entities?: MessageEntity[];
}

export type MessageWarningKind = 'sticker' | 'custom_emoji';

export interface MessageWarning {
    kind: MessageWarningKind;
    text: string;
}

export const CRYING_EMOJIS: readonly string[] = Object.freeze([
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
]);

export function inspectMessage(message: TelegramMessage): MessageWarning | null {
    if (message.sticker) {
        if (message.sticker.emoji && CRYING_EMOJIS.includes(message.sticker.emoji)) {
            return {
                kind: 'sticker',
                text: '请不要发送带有哭泣表情符号的贴纸。',
            };
        }

        return null;
    }

    const text = message.text ?? message.caption;
    const entities = message.entities ?? message.caption_entities;

    if (!text || !entities) {
        return null;
    }

    for (const entity of entities) {
        if (entity.type !== 'custom_emoji') {
            continue;
        }

        const emojiText = text.substring(entity.offset, entity.offset + entity.length);

        if (CRYING_EMOJIS.includes(emojiText)) {
            return {
                kind: 'custom_emoji',
                text: '请不要发送带有哭泣表情符号的自定义表情符号。',
            };
        }
    }

    return null;
}
