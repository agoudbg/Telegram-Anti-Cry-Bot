import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectMessage } from '../tgcloud/lib/message-inspector.js';

const baseMessage = {
    chat: { id: 1 },
    message_id: 42,
};

test('warns about crying sticker emojis', () => {
    assert.deepEqual(
        inspectMessage({
            ...baseMessage,
            sticker: { emoji: '😢' },
        }),
        {
            kind: 'sticker',
            text: '请不要发送带有哭泣表情符号的贴纸。',
        },
    );
});

test('ignores non-crying stickers', () => {
    assert.equal(
        inspectMessage({
            ...baseMessage,
            sticker: { emoji: '🙂' },
        }),
        null,
    );
});

test('warns about a crying custom emoji in text', () => {
    const text = 'hello 😭';

    assert.deepEqual(
        inspectMessage({
            ...baseMessage,
            text,
            entities: [
                {
                    type: 'custom_emoji',
                    offset: text.indexOf('😭'),
                    length: '😭'.length,
                },
            ],
        }),
        {
            kind: 'custom_emoji',
            text: '请不要发送带有哭泣表情符号的自定义表情符号。',
        },
    );
});

test('checks custom emojis in captions', () => {
    const caption = '🥺';

    assert.deepEqual(
        inspectMessage({
            ...baseMessage,
            caption,
            caption_entities: [
                {
                    type: 'custom_emoji',
                    offset: 0,
                    length: caption.length,
                },
            ],
        }),
        {
            kind: 'custom_emoji',
            text: '请不要发送带有哭泣表情符号的自定义表情符号。',
        },
    );
});

test('ignores ordinary entities and messages without text', () => {
    assert.equal(
        inspectMessage({
            ...baseMessage,
            text: '😢',
            entities: [{ type: 'text_link', offset: 0, length: 2 }],
        }),
        null,
    );

    assert.equal(inspectMessage(baseMessage), null);
});
