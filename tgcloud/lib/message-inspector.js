// @ts-check

/**
 * @typedef {Object} MessageEntity
 * @property {string} type
 * @property {number} offset
 * @property {number} length
 */

/**
 * @typedef {Object} TelegramMessage
 * @property {{ id: number }} chat
 * @property {number} message_id
 * @property {{ emoji?: string }} [sticker]
 * @property {string} [text]
 * @property {string} [caption]
 * @property {MessageEntity[]} [entities]
 * @property {MessageEntity[]} [caption_entities]
 */

/**
 * @typedef {Object} MessageWarning
 * @property {'sticker' | 'custom_emoji'} kind
 * @property {string} text
 */

/** @type {readonly string[]} */
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

/**
 * Inspect one Telegram message without depending on a bot framework.
 *
 * @param {TelegramMessage} message
 * @returns {MessageWarning | null}
 */
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
