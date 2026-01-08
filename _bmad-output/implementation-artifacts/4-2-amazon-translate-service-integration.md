# Story 4.2: Amazon Translate Service Integration

Status: done

## Story

As a **developer building translation features**,
I want **an Amazon Translate client service**,
So that **I can translate content to 75+ languages**.

## Acceptance Criteria

1. **Given** the ndx_aws_ai module is enabled
   **When** I inject the Translate service
   **Then** I can:
   - Translate text between any supported language pair
   - Auto-detect source language
   - Preserve HTML formatting in translations
   - Batch translate multiple text segments
   **And** translations are cached by content hash
   **And** the service returns language confidence scores
   **And** unsupported language pairs return clear error messages

## Tasks / Subtasks

- [x] **Task 1: Create Translate Service Class** (AC: 1)
  - [x] 1.1 Create `TranslateService.php` in `ndx_aws_ai/src/Service/`
  - [x] 1.2 Update `TranslateServiceInterface.php` with constants and method signatures
  - [x] 1.3 Implement AWS SDK Translate client initialization via AwsClientFactory
  - [x] 1.4 Define supported languages configuration (75+ languages)

- [x] **Task 2: Implement Text Translation** (AC: 1)
  - [x] 2.1 Create `translateText()` method with source/target language parameters
  - [x] 2.2 Implement auto-detect source language option (when source = 'auto')
  - [x] 2.3 Return translation result with TranslationResult value object
  - [x] 2.4 Handle unsupported language pairs with clear error messages

- [x] **Task 3: HTML Preservation** (AC: 1)
  - [x] 3.1 Implement HTML tag extraction before translation
  - [x] 3.2 Translate text segments only, preserving tag structure
  - [x] 3.3 Reconstruct HTML with translated text
  - [x] 3.4 Handle nested tags and attributes correctly

- [x] **Task 4: Batch Translation** (AC: 1)
  - [x] 4.1 Create `translateBatch()` method for multiple text segments
  - [x] 4.2 Implement efficient batching (respect API limits)
  - [x] 4.3 Return array of translation results with individual status
  - [x] 4.4 Handle partial failures gracefully

- [x] **Task 5: Translation Caching** (AC: 1)
  - [x] 5.1 Create cache key from content hash + source + target language
  - [x] 5.2 Store translations in Drupal cache backend
  - [x] 5.3 Implement cache lookup before API call
  - [x] 5.4 Configure cache TTL (default: 7 days for translations)

- [x] **Task 6: Rate Limiting** (AC: 1)
  - [x] 6.1 Create `TranslateRateLimiter.php` following PollyRateLimiter pattern
  - [x] 6.2 Implement exponential backoff for throttling errors
  - [x] 6.3 Add request queuing for burst protection
  - [x] 6.4 Log rate limit events for monitoring

- [x] **Task 7: Service Registration & Testing** (AC: 1)
  - [x] 7.1 Register services in `ndx_aws_ai.services.yml`
  - [x] 7.2 Create unit tests with mocked Translate client
  - [x] 7.3 Add tests for HTML preservation
  - [x] 7.4 Document service API in code comments

## Dev Notes

### Amazon Translate Limits

- Maximum text length: 10,000 bytes per request
- Rate limits: Varies by region, typically 10 TPS default
- Supported languages: 75+ language pairs

### Supported Language Codes (key subset)

| Code | Language |
|------|----------|
| en | English |
| cy | Welsh |
| fr | French |
| ro | Romanian |
| es | Spanish |
| cs | Czech |
| pl | Polish |
| de | German |
| it | Italian |
| pt | Portuguese |
| zh | Chinese (Simplified) |
| ar | Arabic |
| ur | Urdu |
| pa | Punjabi |
| bn | Bengali |
| gu | Gujarati |
| hi | Hindi |
| ta | Tamil |

Full list: https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html

### AWS SDK Integration

```php
use Aws\Translate\TranslateClient;

$client = new TranslateClient([
    'version' => 'latest',
    'region' => $this->config->get('aws_region'),
    // Credentials from IAM role - no explicit keys
]);

$result = $client->translateText([
    'Text' => $text,
    'SourceLanguageCode' => 'auto', // or specific code
    'TargetLanguageCode' => 'fr',
]);

// Response includes:
// - TranslatedText
// - SourceLanguageCode (detected if 'auto')
// - TargetLanguageCode
```

### HTML Preservation Strategy

1. Extract text nodes from HTML, preserving structure
2. Create placeholders for tags: `<p class="foo">` → `{{TAG_1}}`
3. Translate concatenated text segments
4. Restore tags from placeholders
5. Handle edge cases (self-closing tags, attributes with text)

Alternative: Use Translate's ContentType='text/html' parameter if available.

### Caching Structure

```
Cache key: translate:{source}:{target}:{sha256(text)}
Cache backend: cache.default (Drupal database cache)
TTL: 604800 seconds (7 days)
```

Translations are expensive to regenerate, so longer TTL is appropriate.

### Error Handling

- `UnsupportedLanguagePairException`: Return user-friendly message with supported options
- `TextSizeLimitExceededException`: Chunk text and translate in segments
- `ThrottlingException`: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- `ServiceUnavailable`: Retry with backoff, then fail gracefully

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 4.2]
- [Story 4-1: Polly TTS Service Integration] - pattern for AWS service clients
- [Story 3-2: Bedrock Service Integration] - pattern for AWS service clients
- [Amazon Translate Documentation](https://docs.aws.amazon.com/translate/)
- [Supported Languages](https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html)

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without debug issues

### Completion Notes List

1. Created TranslateService.php implementing TranslateServiceInterface
2. Created TranslateRateLimiter.php for Translate-specific rate limiting
3. Created TranslationResult.php value object for translation responses
4. Created LanguageDetectionResult.php value object for language detection
5. Updated TranslateServiceInterface.php with full method signatures and 75+ languages
6. Implemented text translation with auto-detection support
7. Implemented HTML preservation via tag extraction/reconstruction
8. Implemented batch translation with graceful error handling
9. Implemented database-based caching with 7-day TTL
10. Created comprehensive unit tests with mocked dependencies

### Code Review Fixes Applied

1. Fixed PHPDoc return types in TranslateServiceInterface (wrong namespace path)
2. Fixed detectLanguage() to return NULL confidence (was returning misleading 0.9)
3. Updated LanguageDetectionResult to support nullable confidence
4. Improved clearCache() logging to clarify selective invalidation not supported
5. Added isAvailable() method to TranslateServiceInterface
6. Added HTML preservation tests (testTranslateHtmlBasic, testTranslateHtmlPreservesTags, testTranslateHtmlEmpty)
7. Added testDetectLanguageNullConfidence test

### File List

**Files Created:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Service/TranslateService.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/RateLimiter/TranslateRateLimiter.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Result/TranslationResult.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Result/LanguageDetectionResult.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/tests/src/Unit/TranslateServiceTest.php

**Files Modified:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Service/TranslateServiceInterface.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.services.yml

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with Amazon Translate service specifications | SM Agent |
