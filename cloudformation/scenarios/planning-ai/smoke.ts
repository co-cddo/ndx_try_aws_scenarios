import { runSmoke } from '../../../tests/smoke/runner';

runSmoke({
  scenario: 'planning-ai',
  outputs: ['PlanningAnalyzerURL', 'PlanningDocumentsBucket'],
  publicUrl: { outputKey: 'PlanningAnalyzerURL' },
});
