import { expect } from '@playwright/test';
import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'text-to-speech',
  outputs: ['TextToSpeechConvertURL', 'TextToSpeechAudioBucket'],
  test: async ({ request, get }) => {
    const url = get('TextToSpeechConvertURL');

    const resp = await request.post(url, {
      headers: { 'Content-Type': 'application/json' },
      data: { text: 'NDX:Try smoke test', voice: 'Amy' },
      failOnStatusCode: false,
    });
    expect(resp.status()).toBeLessThan(500);
    expect(resp.status(), 'public Lambda URL needs both InvokeFunctionUrl AND InvokeFunction+InvokedViaFunctionUrl perms').not.toBe(403);

    const body = await resp.json() as { success: boolean; audioUrl: string; voiceId: string; format: string; characterCount: number };
    expect(body.success, `synth failed: ${JSON.stringify(body).slice(0, 200)}`).toBe(true);
    expect(body.voiceId).toBe('Amy');
    expect(body.format).toBe('mp3');
    expect(body.characterCount).toBeGreaterThan(0);

    // Fetch the signed audioUrl: a 200 + audio/mpeg content-type proves Polly
    // wrote a real audio object to the bucket. A 403 here would point at the
    // signing IAM role; a 404 at the Lambda not actually invoking Polly.
    const audio = await request.get(body.audioUrl, { failOnStatusCode: false });
    expect(audio.status(), `signed audioUrl returned ${audio.status()}`).toBe(200);
    const ct = audio.headers()['content-type'] ?? '';
    // S3 serves Polly output as audio/mp3 (less standard); MIME-strict
    // proxies might rewrite to audio/mpeg. Accept either + octet-stream.
    expect(ct).toMatch(/audio\/(mp3|mpeg)|application\/octet-stream/);
    const buf = await audio.body();
    expect(buf.length, 'signed audio body empty').toBeGreaterThan(1024);
    // MP3 magic: ID3 header (0x49 0x44 0x33) or MPEG sync (0xFF 0xFB).
    expect(
      buf[0] === 0x49 || buf[0] === 0xFF,
      `audio body doesn't start with an MP3 header (first byte 0x${buf[0]?.toString(16)})`,
    ).toBe(true);
  },
});
