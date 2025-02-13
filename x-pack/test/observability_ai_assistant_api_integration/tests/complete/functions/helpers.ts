/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  Message,
  MessageAddEvent,
  MessageRole,
  StreamingChatResponseEvent,
} from '@kbn/observability-ai-assistant-plugin/common';
import { Readable } from 'stream';
import type { AssistantScope } from '@kbn/ai-assistant-common';
import { CreateTest } from '../../../common/config';

function decodeEvents(body: Readable | string) {
  return String(body)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StreamingChatResponseEvent);
}

export function getMessageAddedEvents(body: Readable | string) {
  return decodeEvents(body).filter(
    (event): event is MessageAddEvent => event.type === 'messageAdd'
  );
}

export async function invokeChatCompleteWithFunctionRequest({
  connectorId,
  observabilityAIAssistantAPIClient,
  functionCall,
  scopes,
}: {
  connectorId: string;
  observabilityAIAssistantAPIClient: Awaited<
    ReturnType<CreateTest['services']['observabilityAIAssistantAPIClient']>
  >;
  functionCall: Message['message']['function_call'];
  scopes?: AssistantScope[];
}) {
  const { body } = await observabilityAIAssistantAPIClient
    .editor({
      endpoint: 'POST /internal/observability_ai_assistant/chat/complete',
      params: {
        body: {
          messages: [
            {
              '@timestamp': new Date().toISOString(),
              message: {
                role: MessageRole.Assistant,
                content: '',
                function_call: functionCall,
              },
            },
          ],
          connectorId,
          persist: false,
          screenContexts: [],
          scopes: scopes || ['observability' as AssistantScope],
        },
      },
    })
    .expect(200);

  return body;
}
