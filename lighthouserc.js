/**
 * Lighthouse CI Configuration for NDX:Try AWS Scenarios
 *
 * Runs performance and accessibility audits on the built site.
 * Thresholds are set based on acceptance criteria:
 * - Performance: 80
 * - Accessibility: 95
 */

module.exports = {
  ci: {
    collect: {
      staticDistDir: './_site',
      url: [
        'http://localhost/index.html',
        'http://localhost/accessibility/index.html',
        'http://localhost/contact/index.html',
        'http://localhost/404.html',
        'http://localhost/scenarios/index.html',
        'http://localhost/walkthroughs/index.html',
        'http://localhost/walkthroughs/council-chatbot/index.html',
        'http://localhost/walkthroughs/council-chatbot/step-1/index.html',
        'http://localhost/walkthroughs/council-chatbot/complete/index.html',
        'http://localhost/walkthroughs/council-chatbot/explore/index.html',
        'http://localhost/evidence-pack/index.html',
        'http://localhost/quiz/index.html'
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Specific accessibility assertions
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'meta-viewport': 'error',
        'bypass': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'image-alt': 'error',
        'label': 'error',

        // Performance assertions
        'first-contentful-paint': ['warn', { maxNumericValue: 1200 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
