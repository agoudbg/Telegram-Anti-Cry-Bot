declare module 'sdk' {
    interface SendMessageParams {
        chat_id: number;
        text: string;
        reply_parameters?: {
            message_id: number;
        };
    }

    export const api: {
        sendMessage(params: SendMessageParams): Promise<unknown>;
    };
}
