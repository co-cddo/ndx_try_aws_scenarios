#!/usr/bin/env node

/**
 * Schema Validation Script for NDX:Try AWS Scenarios
 *
 * Validates scenarios.yaml against the JSON schema to ensure
 * all scenario metadata is complete and correctly formatted.
 *
 * Usage: node scripts/validate-schema.js
 * Exit codes:
 *   0 - Validation passed
 *   1 - Validation failed (with actionable error messages)
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration for scenarios
const SCENARIO_SCHEMA_PATH = join(projectRoot, 'schemas', 'scenario.schema.json');
const SCENARIO_DATA_PATH = join(projectRoot, 'src', '_data', 'scenarios.yaml');

// Configuration for quiz
const QUIZ_SCHEMA_PATH = join(projectRoot, 'schemas', 'quiz-config.schema.json');
const QUIZ_DATA_PATH = join(projectRoot, 'src', '_data', 'quizConfig.yaml');

// Legacy aliases for backward compatibility
const SCHEMA_PATH = SCENARIO_SCHEMA_PATH;
const DATA_PATH = SCENARIO_DATA_PATH;

function loadSchema() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`ERROR: Schema file not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  try {
    const schemaContent = readFileSync(SCHEMA_PATH, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error(`ERROR: Failed to parse schema file: ${error.message}`);
    process.exit(1);
  }
}

function loadScenariosData() {
  if (!existsSync(DATA_PATH)) {
    console.error(`ERROR: Scenarios data file not found at ${DATA_PATH}`);
    console.error('ACTION: Create src/_data/scenarios.yaml with scenario definitions');
    process.exit(1);
  }

  try {
    const yamlContent = readFileSync(DATA_PATH, 'utf8');
    return parse(yamlContent);
  } catch (error) {
    console.error(`ERROR: Failed to parse scenarios.yaml: ${error.message}`);
    console.error('ACTION: Check YAML syntax at the line indicated above');
    process.exit(1);
  }
}

function formatValidationError(error) {
  const path = error.instancePath || '/';
  const message = error.message;
  const params = error.params;

  let actionableMessage = `  - Path: ${path}\n    Error: ${message}`;

  // Add specific guidance based on error type
  if (error.keyword === 'required') {
    actionableMessage += `\n    ACTION: Add missing field "${params.missingProperty}"`;
  } else if (error.keyword === 'enum') {
    actionableMessage += `\n    ACTION: Use one of: ${params.allowedValues.join(', ')}`;
  } else if (error.keyword === 'pattern') {
    actionableMessage += `\n    ACTION: Value must match pattern: ${params.pattern}`;
  } else if (error.keyword === 'minLength') {
    actionableMessage += `\n    ACTION: Value must be at least ${params.limit} characters`;
  } else if (error.keyword === 'maxLength') {
    actionableMessage += `\n    ACTION: Value must be at most ${params.limit} characters`;
  } else if (error.keyword === 'additionalProperties') {
    actionableMessage += `\n    ACTION: Remove unknown field "${params.additionalProperty}"`;
  }

  return actionableMessage;
}

function validateScenarios() {
  console.log('Validating scenarios.yaml against schema...\n');

  const schema = loadSchema();
  const data = loadScenariosData();

  // Configure AJV validator
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    const scenarioCount = data.scenarios?.length || 0;
    console.log(`SUCCESS: scenarios.yaml is valid`);
    console.log(`  - Validated ${scenarioCount} scenario(s)`);

    // List validated scenarios
    if (data.scenarios) {
      data.scenarios.forEach((scenario, index) => {
        console.log(`    ${index + 1}. ${scenario.name} (${scenario.id})`);
      });
    }

    return true;
  } else {
    console.error('VALIDATION FAILED: scenarios.yaml has errors\n');
    console.error('Errors found:');

    validate.errors.forEach((error, index) => {
      console.error(`\n[${index + 1}]`);
      console.error(formatValidationError(error));
    });

    console.error('\n---');
    console.error('Fix the errors above and run validation again.');
    console.error('Schema documentation: schemas/scenario.schema.json');

    return false;
  }
}

function validateQuizConfig() {
  console.log('\nValidating quiz-config.yaml against schema...\n');

  if (!existsSync(QUIZ_SCHEMA_PATH)) {
    console.log('INFO: Quiz schema not found - skipping quiz validation');
    return true;
  }

  if (!existsSync(QUIZ_DATA_PATH)) {
    console.log('INFO: quiz-config.yaml not found - skipping quiz validation');
    return true;
  }

  try {
    const schemaContent = readFileSync(QUIZ_SCHEMA_PATH, 'utf8');
    const schema = JSON.parse(schemaContent);

    const yamlContent = readFileSync(QUIZ_DATA_PATH, 'utf8');
    const data = parse(yamlContent);

    const ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(ajv);

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
      const questionCount = data.questions?.length || 0;
      console.log(`SUCCESS: quiz-config.yaml is valid`);
      console.log(`  - Validated ${questionCount} question(s)`);

      if (data.questions) {
        data.questions.forEach((question, index) => {
          const optionCount = question.options?.length || 0;
          console.log(`    ${index + 1}. ${question.id}: "${question.text}" (${optionCount} options)`);
        });
      }

      return true;
    } else {
      console.error('VALIDATION FAILED: quiz-config.yaml has errors\n');
      console.error('Errors found:');

      validate.errors.forEach((error, index) => {
        console.error(`\n[${index + 1}]`);
        console.error(formatValidationError(error));
      });

      console.error('\n---');
      console.error('Fix the errors above and run validation again.');
      console.error('Schema documentation: schemas/quiz-config.schema.json');

      return false;
    }
  } catch (error) {
    console.error(`ERROR: Failed to validate quiz config: ${error.message}`);
    return false;
  }
}

// Main execution
const scenariosValid = validateScenarios();
const quizValid = validateQuizConfig();
const isValid = scenariosValid && quizValid;

if (isValid) {
  console.log('\n✅ All validations passed!');
} else {
  console.error('\n❌ Validation failed - fix errors above');
}

process.exit(isValid ? 0 : 1);
