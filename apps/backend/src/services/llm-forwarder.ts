// This will later handle forwarding to LLM buffer
import { ServerToClientMessage } from 'shared/types/websocket';

export function forwardToLLMBuffer(message: ServerToClientMessage) {
  // TODO: Implement actual LLM forwarding
  console.log('Forwarding to LLM buffer:', message);
}
