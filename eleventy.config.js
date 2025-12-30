import { govukEleventyPlugin } from '@x-govuk/govuk-eleventy-plugin';
import yaml from 'js-yaml';
import { readFileSync } from 'fs';

export default function(eleventyConfig) {
  // Add YAML data extension for Eleventy 3.x
  eleventyConfig.addDataExtension('yaml,yml', (contents) => {
    return yaml.load(contents);
  });

  // Register GOV.UK Eleventy Plugin
  eleventyConfig.addPlugin(govukEleventyPlugin, {
        rebrand: true,

    brandColour: '#1d70b8',
    fontFamily: 'system-ui, sans-serif',
    icons: {
      mask: 'https://www.gov.uk/assets/static/govuk-mask-icon-de738c3fcce9.svg',
      shortcut: 'https://www.gov.uk/assets/static/govuk-favicon-b6dfa4ecd9f4.ico',
      touch: 'https://www.gov.uk/assets/static/govuk-opengraph-image-dade5b1c2f65.png'
    },
    opengraphImageUrl: 'https://www.gov.uk/assets/static/govuk-opengraph-image-dade5b1c2f65.png',
    homeKey: 'NDX:Try AWS',
    parentSite: {
      url: 'https://www.gov.uk/',
      name: 'GOV.UK'
    },
    url: process.env.GITHUB_PAGES_URL || 'http://localhost:8080',
    header: {
      organisationLogo: false,
      organisationName: 'NDX:Try AWS',
      productName: 'AWS Scenarios for UK Councils',
      search: false,
      logotype: {
        text: " ",
      },
    },
    
    footer: {
      copyright: {
        text: 'Open Government Licence v3.0'
      },
      contentLicence: {
        html: 'All content is available under the <a class="govuk-footer__link" href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" rel="license">Open Government Licence v3.0</a>, except where otherwise stated'
      },
      meta: {
        html: '<p class="govuk-body-s govuk-!-margin-top-4">Part of the <a href="https://www.local.gov.uk/our-support/cyber-digital-and-technology/artificial-intelligence" class="govuk-footer__link" target="_blank" rel="noopener noreferrer">LGA AI Hub<span class="govuk-visually-hidden"> (opens in new tab)</span></a> ecosystem</p>'
      }
    },
    // Include both GOV.UK compiled styles AND custom NDX styles
    // The SCSS @import wasn't working with plugin compilation, so load separately
    stylesheets: [
      '/assets/application.css',
      '/assets/css/custom.css'
    ]
  });

  // Pass through static assets
  eleventyConfig.addPassthroughCopy('src/assets');

  // Pass through lib directory for JavaScript modules (Story 2.9)
  eleventyConfig.addPassthroughCopy({ 'src/lib': 'lib' });

  // Add custom filters
  eleventyConfig.addFilter('capitalize', (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Add difficulty tag color mapping
  eleventyConfig.addFilter('difficultyColor', (difficulty) => {
    const colors = {
      'beginner': 'green',
      'intermediate': 'yellow',
      'advanced': 'red'
    };
    return colors[difficulty?.toLowerCase()] || 'grey';
  });

  // Add persona tag color mapping
  eleventyConfig.addFilter('personaColor', (persona) => {
    const colors = {
      'technical': 'blue',
      'service-manager': 'purple',
      'finance': 'turquoise',
      'leadership': 'orange'
    };
    return colors[persona?.toLowerCase()] || 'grey';
  });

  // Add category tag color mapping (Story 14.1)
  eleventyConfig.addFilter('categoryColor', (category) => {
    const colors = {
      'ai': 'blue',
      'iot': 'green',
      'analytics': 'purple'
    };
    return colors[category?.toLowerCase()] || 'grey';
  });

  // Map scenario to category based on tags (Story 14.1)
  eleventyConfig.addFilter('scenarioCategory', (scenario) => {
    if (!scenario || !scenario.tags) return 'ai';
    const tags = scenario.tags.map(t => t.toLowerCase());
    if (tags.includes('iot')) return 'iot';
    if (tags.includes('analytics')) return 'analytics';
    return 'ai'; // Default for AI, Chatbot, Document Processing, etc.
  });

  // Get walkthrough step count for a scenario (Story 14.1)
  eleventyConfig.addFilter('walkthroughSteps', (scenarioId) => {
    // All scenarios have 4 steps
    return 4;
  });

  // Slug filter - converts strings to URL-safe slugs (Story 3.2)
  // Used in: wow-moment.njk, step-3.njk for generating IDs
  eleventyConfig.addFilter('slug', (str) => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')      // Remove special characters
      .replace(/[\s_-]+/g, '-')       // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, '');       // Remove leading/trailing hyphens
  });


  // CloudFormation Deploy URL Generator (AC-2.1.1, AC-2.1.2, AC-2.1.3, AC-2.1.8)
  eleventyConfig.addFilter('deployUrl', (scenario) => {
    if (!scenario || !scenario.deployment) {
      return '#';
    }

    const deployment = scenario.deployment;
    const region = deployment.region || 'eu-west-2';
    const templateUrl = deployment.templateUrl || deployment.templateS3Url;

    if (!templateUrl) {
      return '#';
    }

    // Generate unique stack name: ndx-try-{scenario-id}-{timestamp}
    // Timestamp is added client-side for uniqueness, server-side uses placeholder
    const stackNamePrefix = deployment.stackNamePrefix || `ndx-try-${scenario.id}`;
    // Ensure stack name is <= 128 chars (AC-2.1.3)
    const maxPrefixLen = 128 - 14; // Leave room for -timestamp
    const truncatedPrefix = stackNamePrefix.substring(0, maxPrefixLen);
    const stackName = `${truncatedPrefix}-{timestamp}`;

    // Build CloudFormation Quick Create URL
    const baseUrl = `https://console.aws.amazon.com/cloudformation/home`;
    const params = new URLSearchParams();

    // Template URL parameter
    const encodedTemplateUrl = encodeURIComponent(templateUrl);

    // Build parameter string for CloudFormation parameters
    let paramString = '';
    if (deployment.parameters) {
      deployment.parameters.forEach(param => {
        // Validate parameter name (CloudFormation: alphanumeric + hyphens, max 255 chars)
        if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(param.name) || param.name.length > 255) {
          console.warn(`CloudFormation: Invalid parameter name skipped: ${param.name}`);
          return;
        }
        // Validate parameter value length (AWS limit is 4096)
        const value = String(param.value);
        if (value.length > 4096) {
          console.warn(`CloudFormation: Parameter ${param.name} value exceeds length limit`);
          return;
        }
        paramString += `&param_${param.name}=${encodeURIComponent(value)}`;
      });
    }

    // Construct full URL
    // Format: https://console.aws.amazon.com/cloudformation/home?region={region}#/stacks/quickcreate?templateURL={url}&stackName={name}&param_X=Y
    const deployUrl = `${baseUrl}?region=${region}#/stacks/quickcreate?templateURL=${encodedTemplateUrl}&stackName=${encodeURIComponent(stackName)}${paramString}`;

    return deployUrl;
  });

  // Get related scenarios by ID (Phase 4 - Cross-linking)
  eleventyConfig.addFilter('getRelatedScenarios', (scenario, allScenarios) => {
    if (!scenario || !scenario.relatedScenarios || !allScenarios) return [];
    return allScenarios.filter(s =>
      scenario.relatedScenarios.includes(s.id) && s.id !== scenario.id
    );
  });

  // Human-readable date filter (Story 2.4)
  eleventyConfig.addFilter('readableDate', (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  });

  // Return URL allowlist validation (AC-2.1.8)
  eleventyConfig.addFilter('isAllowedReturnUrl', (url) => {
    if (!url) return false;
    const allowedDomains = [
      'localhost',
      '127.0.0.1',
      'ndx-try.service.gov.uk',
      'github.io'
    ];
    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => urlObj.hostname.endsWith(domain) || urlObj.hostname === domain);
    } catch {
      return false;
    }
  });

  // Watch targets for development
  eleventyConfig.addWatchTarget('src/assets/');

  return {
    dataTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dir: {
      input: 'src',
      data: '_data',
      includes: '_includes'
    },
    pathPrefix: process.env.GITHUB_PAGES_PATH_PREFIX || '/'
  };
}
