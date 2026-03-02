#!/usr/bin/env python3
"""
Build deployable CloudFormation template from source template + PDF/text files.

Reads template.yaml (which contains placeholder markers) and the generated
sample PDF and extracted text, producing a complete deployable template on stdout.

Usage:
    python3 build-template.py > /tmp/planning-ai-deploy.yaml
    python3 build-template.py -o /tmp/planning-ai-deploy.yaml

The PDF file (sample-planning-application.pdf) is the single source of truth.
Run generate-sample-pdf.py first if the PDF doesn't exist.
"""

import argparse
import base64
import os
import sys
import textwrap


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_FILE = os.path.join(SCRIPT_DIR, 'template.yaml')
PDF_FILE = os.path.join(SCRIPT_DIR, 'sample-planning-application.pdf')
TEXT_FILE = os.path.join(SCRIPT_DIR, 'sample_document_text.txt')

# Markers in template.yaml that get replaced with actual content
PDF_MARKER = '          # __SAMPLE_PDF_BASE64__'
TEXT_MARKER = '          # __SAMPLE_DOCUMENT_TEXT__'

# Indentation inside the ZipFile block (10 spaces)
INDENT = '          '


def read_pdf_as_base64(pdf_path):
    """Read PDF file and return base64-encoded string, wrapped at 76 chars."""
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
    b64 = base64.b64encode(pdf_bytes).decode('ascii')
    # Wrap at 76 chars per line (standard base64 line length)
    lines = textwrap.wrap(b64, 76)
    return lines


def read_text_file(text_path):
    """Read extracted text file and return lines."""
    with open(text_path, 'r') as f:
        return f.read().rstrip('\n').split('\n')


def build_template(template_path, pdf_path, text_path):
    """Build deployable template by replacing markers with file contents."""
    with open(template_path, 'r') as f:
        template_lines = f.readlines()

    pdf_b64_lines = read_pdf_as_base64(pdf_path)
    text_lines = read_text_file(text_path)

    output = []
    for line in template_lines:
        stripped = line.rstrip('\n')

        if stripped == PDF_MARKER:
            # Replace marker with: SAMPLE_DOCUMENT_PDF = """<base64>"""
            output.append(f'{INDENT}SAMPLE_DOCUMENT_PDF = """\n')
            for b64_line in pdf_b64_lines:
                output.append(f'{INDENT}{b64_line}\n')
            output.append(f'{INDENT}"""\n')
        elif stripped == TEXT_MARKER:
            # Replace marker with: SAMPLE_DOCUMENT_TEXT = """<text>"""
            output.append(f'{INDENT}SAMPLE_DOCUMENT_TEXT = """\n')
            for text_line in text_lines:
                output.append(f'{INDENT}{text_line}\n')
            output.append(f'{INDENT}"""\n')
        else:
            output.append(line)

    return ''.join(output)


def main():
    parser = argparse.ArgumentParser(description='Build deployable CloudFormation template')
    parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    args = parser.parse_args()

    # Check source files exist
    for path, label in [(TEMPLATE_FILE, 'template.yaml'), (PDF_FILE, 'PDF'), (TEXT_FILE, 'text')]:
        if not os.path.exists(path):
            print(f'Error: {label} not found at {path}', file=sys.stderr)
            if label == 'PDF':
                print('Run: python3 generate-sample-pdf.py', file=sys.stderr)
            sys.exit(1)

    result = build_template(TEMPLATE_FILE, PDF_FILE, TEXT_FILE)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(result)
        print(f'Written deployable template to {args.output}', file=sys.stderr)
    else:
        sys.stdout.write(result)


if __name__ == '__main__':
    main()
