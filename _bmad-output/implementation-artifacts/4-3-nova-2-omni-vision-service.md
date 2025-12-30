# Story 4.3: Nova 2 Omni Vision Service

Status: done

## Story

As a **developer building image analysis features**,
I want **a Nova 2 Omni vision client**,
So that **I can generate descriptions from images**.

## Acceptance Criteria

1. **Given** the ndx_aws_ai module is enabled
   **When** I inject the Vision service
   **Then** I can:
   - Analyze images and return text descriptions
   - Generate alt-text optimized for accessibility
   - Handle JPEG, PNG, and WebP formats
   - Process images up to 5MB
   **And** descriptions follow WCAG alt-text best practices
   **And** the service rejects inappropriate content
   **And** processing time is under 5 seconds per image

## Tasks / Subtasks

- [x] **Task 1: Create Vision Service Interface** (AC: 1)
  - [x] 1.1 Create `VisionServiceInterface.php` in `ndx_aws_ai/src/Service/`
  - [x] 1.2 Define method signatures for image analysis
  - [x] 1.3 Define supported image formats constant (JPEG, PNG, WebP)
  - [x] 1.4 Define maximum file size constant (5MB)

- [x] **Task 2: Implement Vision Service Class** (AC: 1)
  - [x] 2.1 Create `VisionService.php` implementing VisionServiceInterface
  - [x] 2.2 Use AwsClientFactory to get Bedrock Runtime client
  - [x] 2.3 Configure Nova 2 Omni model ID (amazon.nova-lite-v1:0 or amazon.nova-pro-v1:0)
  - [x] 2.4 Implement base64 image encoding for API payload

- [x] **Task 3: Implement analyzeImage Method** (AC: 1)
  - [x] 3.1 Create `analyzeImage()` method accepting file path or binary data
  - [x] 3.2 Validate image format (JPEG, PNG, WebP)
  - [x] 3.3 Validate file size (max 5MB)
  - [x] 3.4 Construct Bedrock InvokeModel request with vision payload
  - [x] 3.5 Parse response and extract description

- [x] **Task 4: Implement Alt-Text Generation** (AC: 1)
  - [x] 4.1 Create `generateAltText()` method with accessibility-focused prompt
  - [x] 4.2 Use WCAG alt-text best practices prompt template
  - [x] 4.3 Return alt-text with appropriate length (max 125 characters)
  - [x] 4.4 Include option for extended description (longdesc)

- [x] **Task 5: Content Moderation** (AC: 1)
  - [x] 5.1 Add content moderation check in prompt
  - [x] 5.2 Detect inappropriate/sensitive content flags in response
  - [x] 5.3 Create `ImageAnalysisResult` value object with moderation fields
  - [x] 5.4 Return appropriate error for rejected content

- [x] **Task 6: Rate Limiting & Error Handling** (AC: 1)
  - [x] 6.1 Create `VisionRateLimiter.php` following existing pattern
  - [x] 6.2 Implement retry with exponential backoff
  - [x] 6.3 Handle Bedrock throttling and model errors
  - [x] 6.4 Log performance metrics (processing time)

- [x] **Task 7: Service Registration & Testing** (AC: 1)
  - [x] 7.1 Register VisionService in `ndx_aws_ai.services.yml`
  - [x] 7.2 Create unit tests with mocked Bedrock client
  - [x] 7.3 Test image format validation
  - [x] 7.4 Document service API in code comments

## Dev Notes

### Nova 2 Omni Vision Integration

Nova 2 Omni (amazon.nova-lite-v1:0) supports vision capabilities via the Converse API or InvokeModel with multimodal messages.

```php
use Aws\BedrockRuntime\BedrockRuntimeClient;

$client = new BedrockRuntimeClient([
    'version' => 'latest',
    'region' => $this->config->get('aws_region'),
]);

// Using Converse API for vision
$result = $client->converse([
    'modelId' => 'amazon.nova-lite-v1:0',
    'messages' => [
        [
            'role' => 'user',
            'content' => [
                [
                    'image' => [
                        'format' => 'jpeg', // jpeg, png, gif, webp
                        'source' => [
                            'bytes' => base64_decode($imageBase64),
                        ],
                    ],
                ],
                [
                    'text' => 'Describe this image for accessibility purposes...',
                ],
            ],
        ],
    ],
]);
```

### Alt-Text Best Practices Prompt

```
Analyze this image and generate concise alt-text following WCAG 2.2 AA guidelines:

1. Be specific and succinct (aim for 125 characters or less)
2. Describe the content and function, not the appearance
3. Don't start with "Image of" or "Picture of"
4. Include relevant text that appears in the image
5. For decorative images, indicate if purely decorative
6. For complex images (charts, diagrams), provide brief summary

Focus on what a screen reader user needs to understand the image's purpose in context.
```

### Image Format Detection

```php
$mimeType = mime_content_type($filePath);
$supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];

// Map MIME type to Nova format
$formatMap = [
    'image/jpeg' => 'jpeg',
    'image/png' => 'png',
    'image/webp' => 'webp',
];
```

### Content Moderation Response

If Nova 2 Omni detects inappropriate content, the response may include moderation signals. Handle these gracefully:

```php
if ($response['stopReason'] === 'content_filtered') {
    throw new ContentModerationException('Image contains inappropriate content');
}
```

### File Size Limits

- Maximum image size: 5MB (5,242,880 bytes)
- Recommended resolution: Up to 4096x4096 pixels
- Base64 encoding increases payload size by ~33%

### ImageAnalysisResult Value Object

```php
final class ImageAnalysisResult {
    public function __construct(
        public readonly string $description,
        public readonly ?string $altText,
        public readonly bool $isAppropriate,
        public readonly ?string $moderationReason,
        public readonly float $processingTimeMs,
    ) {}
}
```

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 4.3]
- [Story 4-1: Polly TTS Service Integration] - pattern for AWS service clients
- [Story 4-2: Amazon Translate Service Integration] - pattern for AWS service clients
- [Story 3-2: Bedrock Service Integration] - Bedrock client usage patterns
- [Amazon Nova Documentation](https://docs.aws.amazon.com/nova/latest/userguide/)
- [WCAG 2.2 Alt-Text Requirements](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)

## Dev Agent Record

### Agent Model Used

claude-opus-4-5-20251101

### Debug Log References

N/A - Implementation completed without debug issues

### Completion Notes List

1. Created VisionServiceInterface.php with comprehensive method signatures
2. Created VisionService.php implementing image analysis with Nova models
3. Created VisionRateLimiter.php with Vision/Bedrock-specific retry handling
4. Created ImageAnalysisResult.php value object with moderation support
5. Implemented analyzeImage() and analyzeImageFromFile() methods
6. Implemented generateAltText() and generateAltTextFromFile() methods
7. Implemented WCAG 2.2 AA compliant alt-text generation (max 125 chars)
8. Implemented content moderation detection (content_filtered and text flags)
9. Added format validation (JPEG, PNG, WebP)
10. Added file size validation (max 5MB)
11. Registered VisionService in ndx_aws_ai.services.yml
12. Created comprehensive unit tests with mocked Bedrock client

### File List

**Files Created:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Service/VisionServiceInterface.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Service/VisionService.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/RateLimiter/VisionRateLimiter.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/src/Result/ImageAnalysisResult.php
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/tests/src/Unit/VisionServiceTest.php

**Files Modified:**
- cloudformation/scenarios/localgov-drupal/drupal/web/modules/custom/ndx_aws_ai/ndx_aws_ai.services.yml

## Code Review Record

### Review Date
2025-12-30

### Issues Found & Fixed

1. **HIGH: Missing logging for successful operations**
   - Added `logOperation()` call after successful API responses in `invokeVisionModel()`
   - Logs model ID, format, processing time, and moderation status

2. **HIGH: Inconsistent operation name in error handling**
   - Changed from hardcoded 'analyzeImage' to dynamic `$operation` based on `$generateAltText` flag
   - Now correctly logs 'generateAltText' vs 'analyzeImage'

3. **MEDIUM: Test assertions using exact processingTimeMs values**
   - Updated all test expectations to use `Prophecy\Argument::that()` matchers
   - Tests now flexibly verify required fields without failing on timing variations

4. **MEDIUM: Missing edge case tests**
   - Added `testEmptyResponseHandling()` for empty API responses
   - Added `testWebpFormatSupport()` for WebP format validation

### Files Modified During Review
- VisionService.php - Added logging, fixed operation name
- VisionServiceTest.php - Added Argument import, fixed all test matchers, added 2 new tests

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-30 | Story created with Nova 2 Omni vision specifications | SM Agent |
| 2025-12-30 | Implementation complete, moved to review | Dev Agent |
| 2025-12-30 | Code review complete, all issues fixed, moved to done | Dev Agent |
