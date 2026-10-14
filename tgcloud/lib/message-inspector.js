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
function containsCryingEmoji(text) {
    return CRYING_EMOJIS.some((emoji) => text.includes(emoji));
}
function inspectRichValue(value) {
    if (typeof value === 'string') {
        return containsCryingEmoji(value) ? 'emoji' : null;
    }
    if (Array.isArray(value)) {
        let hasCryingEmoji = false;
        for (const item of value) {
            const warningKind = inspectRichValue(item);
            if (warningKind === 'custom_emoji') {
                return warningKind;
            }
            if (warningKind === 'emoji') {
                hasCryingEmoji = true;
            }
        }
        return hasCryingEmoji ? 'emoji' : null;
    }
    if (value === null || typeof value !== 'object') {
        return null;
    }
    const object = value;
    if (object.type === 'custom_emoji' &&
        typeof object.alternative_text === 'string' &&
        containsCryingEmoji(object.alternative_text)) {
        return 'custom_emoji';
    }
    let hasCryingEmoji = false;
    for (const child of Object.values(object)) {
        const warningKind = inspectRichValue(child);
        if (warningKind === 'custom_emoji') {
            return warningKind;
        }
        if (warningKind === 'emoji') {
            hasCryingEmoji = true;
        }
    }
    return hasCryingEmoji ? 'emoji' : null;
}
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
    const richWarningKind = inspectRichValue(message.rich_message);
    if (richWarningKind === 'custom_emoji') {
        return {
            kind: 'custom_emoji',
            text: '请不要发送带有哭泣表情符号的自定义表情符号。',
        };
    }
    if (richWarningKind === 'emoji') {
        return {
            kind: 'emoji',
            text: '请不要发送带有哭泣表情符号的消息。',
        };
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
    if (containsCryingEmoji(text)) {
        return {
            kind: 'emoji',
            text: '请不要发送带有哭泣表情符号的消息。',
        };
    }
    return null;
}
