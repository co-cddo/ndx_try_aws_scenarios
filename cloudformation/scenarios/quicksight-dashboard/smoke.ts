import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'quicksight-dashboard',
  outputs: ['QuicksightDashboardUrl', 'QuicksightDataBucket'],
  publicUrl: { outputKey: 'QuicksightDashboardUrl' },
});
