import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'text-to-speech',
  outputs: ['TextToSpeechConvertURL', 'TextToSpeechAudioBucket'],
  publicUrl: { outputKey: 'TextToSpeechConvertURL' },
});
