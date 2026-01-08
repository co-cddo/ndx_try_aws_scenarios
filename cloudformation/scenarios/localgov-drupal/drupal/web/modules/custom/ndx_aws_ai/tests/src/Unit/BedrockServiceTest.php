<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Result;
use Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager;
use Drupal\ndx_aws_ai\RateLimiter\BedrockRateLimiter;
use Drupal\ndx_aws_ai\Response\BedrockResponseParser;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Drupal\ndx_aws_ai\Service\BedrockService;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\Tests\UnitTestCase;
use Prophecy\PhpUnit\ProphecyTrait;

/**
 * Tests for BedrockService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\BedrockService
 * @group ndx_aws_ai
 *
 * Story 3.2: Bedrock Service Integration
 */
class BedrockServiceTest extends UnitTestCase {

  use ProphecyTrait;

  /**
   * The mocked AWS client factory.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsClientFactory|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $clientFactory;

  /**
   * The mocked Bedrock client.
   *
   * @var \Aws\BedrockRuntime\BedrockRuntimeClient|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $bedrockClient;

  /**
   * The mocked error handler.
   *
   * @var \Drupal\ndx_aws_ai\Service\AwsErrorHandler|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $errorHandler;

  /**
   * The mocked prompt template manager.
   *
   * @var \Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $promptManager;

  /**
   * The mocked rate limiter.
   *
   * @var \Drupal\ndx_aws_ai\RateLimiter\BedrockRateLimiter|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $rateLimiter;

  /**
   * The mocked response parser.
   *
   * @var \Drupal\ndx_aws_ai\Response\BedrockResponseParser|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $responseParser;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->bedrockClient = $this->prophesize(BedrockRuntimeClient::class);
    $this->clientFactory = $this->prophesize(AwsClientFactory::class);
    $this->clientFactory->getBedrockClient()
      ->willReturn($this->bedrockClient->reveal());

    $this->errorHandler = $this->prophesize(AwsErrorHandler::class);
    $this->promptManager = $this->prophesize(PromptTemplateManager::class);
    $this->rateLimiter = $this->prophesize(BedrockRateLimiter::class);
    $this->responseParser = $this->prophesize(BedrockResponseParser::class);
  }

  /**
   * Create a BedrockService with mocked dependencies.
   *
   * @return \Drupal\ndx_aws_ai\Service\BedrockService
   *   The service under test.
   */
  protected function createService(): BedrockService {
    return new BedrockService(
      $this->clientFactory->reveal(),
      $this->errorHandler->reveal(),
      $this->promptManager->reveal(),
      $this->rateLimiter->reveal(),
      $this->responseParser->reveal(),
    );
  }

  /**
   * Create a mock AWS Result object.
   *
   * @param string $content
   *   The content to return.
   * @param int $inputTokens
   *   Input token count.
   * @param int $outputTokens
   *   Output token count.
   *
   * @return \Aws\Result
   *   A mock result object.
   */
  protected function createMockResult(
    string $content = 'Generated content',
    int $inputTokens = 100,
    int $outputTokens = 50,
  ): Result {
    return new Result([
      'output' => [
        'message' => [
          'content' => [
            ['text' => $content],
          ],
        ],
      ],
      'usage' => [
        'inputTokens' => $inputTokens,
        'outputTokens' => $outputTokens,
        'totalTokens' => $inputTokens + $outputTokens,
      ],
      'stopReason' => 'end_turn',
    ]);
  }

  /**
   * Tests generateContent with default model.
   *
   * @covers ::generateContent
   */
  public function testGenerateContentWithDefaultModel(): void {
    $prompt = 'Write about council services';
    $expectedContent = 'Here is information about council services...';

    $mockResult = $this->createMockResult($expectedContent);

    // Set up expectations.
    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => BedrockServiceInterface::MODEL_NOVA_PRO,
      'messages' => [
        [
          'role' => 'user',
          'content' => [
            ['text' => $prompt],
          ],
        ],
      ],
      'inferenceConfig' => [
        'maxTokens' => 4096,
        'temperature' => 0.7,
        'topP' => 0.9,
      ],
    ])->willReturn($mockResult);

    $this->responseParser->extractContent($mockResult)
      ->willReturn($expectedContent);

    $this->responseParser->extractUsage($mockResult)
      ->willReturn([
        'inputTokens' => 100,
        'outputTokens' => 50,
        'totalTokens' => 150,
      ]);

    $this->errorHandler->logOperation('Bedrock', 'Converse', [
      'model' => BedrockServiceInterface::MODEL_NOVA_PRO,
      'inputTokens' => 100,
      'outputTokens' => 50,
      'totalTokens' => 150,
    ])->shouldBeCalled();

    $service = $this->createService();
    $result = $service->generateContent($prompt);

    $this->assertEquals($expectedContent, $result);
  }

  /**
   * Tests generateContent with custom model and options.
   *
   * @covers ::generateContent
   */
  public function testGenerateContentWithCustomOptions(): void {
    $prompt = 'Summarize this text';
    $expectedContent = 'Summary of the text.';
    $systemPrompt = 'You are a summarization expert.';

    $mockResult = $this->createMockResult($expectedContent);

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->bedrockClient->converse([
      'modelId' => BedrockServiceInterface::MODEL_NOVA_LITE,
      'messages' => [
        [
          'role' => 'user',
          'content' => [
            ['text' => $prompt],
          ],
        ],
      ],
      'inferenceConfig' => [
        'maxTokens' => 1024,
        'temperature' => 0.3,
        'topP' => 0.8,
      ],
      'system' => [
        ['text' => $systemPrompt],
      ],
    ])->willReturn($mockResult);

    $this->responseParser->extractContent($mockResult)
      ->willReturn($expectedContent);

    $this->responseParser->extractUsage($mockResult)
      ->willReturn([
        'inputTokens' => 50,
        'outputTokens' => 25,
        'totalTokens' => 75,
      ]);

    $this->errorHandler->logOperation('Bedrock', 'Converse', [
      'model' => BedrockServiceInterface::MODEL_NOVA_LITE,
      'inputTokens' => 50,
      'outputTokens' => 25,
      'totalTokens' => 75,
    ])->shouldBeCalled();

    $service = $this->createService();
    $result = $service->generateContent($prompt, BedrockServiceInterface::MODEL_NOVA_LITE, [
      'maxTokens' => 1024,
      'temperature' => 0.3,
      'topP' => 0.8,
      'systemPrompt' => $systemPrompt,
    ]);

    $this->assertEquals($expectedContent, $result);
  }

  /**
   * Tests simplifyText uses the correct template.
   *
   * @covers ::simplifyText
   */
  public function testSimplifyText(): void {
    $originalText = 'The municipality shall endeavour to facilitate...';
    $simplifiedText = 'The council will help...';
    $targetAge = 9;

    $template = [
      'user' => 'Simplify this: {{text}}',
      'system' => 'Simplify for reading age {{target_age}}.',
      'parameters' => [
        'maxTokens' => 2048,
        'temperature' => 0.3,
      ],
    ];

    $mockResult = $this->createMockResult($simplifiedText);

    $this->promptManager->loadTemplate('simplification')
      ->willReturn($template);

    $this->promptManager->render($template, [
      'text' => $originalText,
      'target_age' => '9',
    ])->willReturn("Simplify this: {$originalText}");

    $this->promptManager->renderSystem($template, [
      'target_age' => '9',
    ])->willReturn('Simplify for reading age 9.');

    $this->rateLimiter->getMaxRetries()->willReturn(3);
    $this->rateLimiter->waitIfNeeded()->shouldBeCalled();
    $this->rateLimiter->recordSuccess()->shouldBeCalled();

    $this->bedrockClient->converse(\Prophecy\Argument::any())
      ->willReturn($mockResult);

    $this->responseParser->extractContent($mockResult)
      ->willReturn($simplifiedText);

    $this->responseParser->extractUsage($mockResult)
      ->willReturn([
        'inputTokens' => 80,
        'outputTokens' => 30,
        'totalTokens' => 110,
      ]);

    $this->errorHandler->logOperation('Bedrock', 'Converse', \Prophecy\Argument::any())
      ->shouldBeCalled();

    $service = $this->createService();
    $result = $service->simplifyText($originalText, $targetAge);

    $this->assertEquals($simplifiedText, $result);
  }

  /**
   * Tests the service implements the interface.
   *
   * @covers ::__construct
   */
  public function testImplementsInterface(): void {
    $service = $this->createService();

    $this->assertInstanceOf(BedrockServiceInterface::class, $service);
  }

  /**
   * Tests model constants are defined correctly.
   *
   * @covers \Drupal\ndx_aws_ai\Service\BedrockServiceInterface
   */
  public function testModelConstants(): void {
    $this->assertEquals('amazon.nova-pro-v1:0', BedrockServiceInterface::MODEL_NOVA_PRO);
    $this->assertEquals('amazon.nova-lite-v1:0', BedrockServiceInterface::MODEL_NOVA_LITE);
    $this->assertEquals('amazon.nova-premier-v1:0', BedrockServiceInterface::MODEL_NOVA_PREMIER);
  }

}
