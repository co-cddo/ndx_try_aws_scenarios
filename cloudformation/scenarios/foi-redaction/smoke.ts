import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'foi-redaction',
  outputs: ['RedactionURL', 'FoiDocumentsBucket'],
  publicUrl: { outputKey: 'RedactionURL' },
});
