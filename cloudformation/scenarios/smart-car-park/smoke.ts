import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'smart-car-park',
  outputs: ['SmartCarParkDashboardURL', 'SmartCarParkSensorReadingsTable'],
  publicUrl: { outputKey: 'SmartCarParkDashboardURL' },
});
