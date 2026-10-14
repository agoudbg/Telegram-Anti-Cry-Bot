export const CRYING_EMOJIS = Object.freeze([
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
export function inspectMessage(message) {
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
    if (!text) {
        return null;
    }
    for (const entity of entities ?? []) {
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
    if (CRYING_EMOJIS.some((emoji) => text.includes(emoji))) {
        return {
            kind: 'emoji',
            text: '请不要发送带有哭泣表情符号的消息。',
        };
    }
    return null;
}
