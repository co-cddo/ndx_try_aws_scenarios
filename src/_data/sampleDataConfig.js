import yaml from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the YAML file
const yamlFilePath = join(__dirname, 'sample-data-config.yaml');
const fileContents = readFileSync(yamlFilePath, 'utf8');
const data = yaml.load(fileContents);

// Export the full data object
export default data;
