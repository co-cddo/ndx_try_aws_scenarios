import { runSmoke } from '../../../tests/smoke/runner';

// POST forces the Lambda to boot and reach Bedrock; a GET against the
// FunctionURL returns 405 which would pass the 5xx check vacuously.
runSmoke({
  scenario: 'council-chatbot',
  outputs: ['ChatbotURL', 'ChatbotKnowledgeBaseBucket'],
  publicUrl: {
    outputKey: 'ChatbotURL',
    method: 'POST',
    postBody: {
      headers: { 'Content-Type': 'application/json' },
      data: { message: 'hi', sessionId: 'smoke-test' },
    },
  },
});
