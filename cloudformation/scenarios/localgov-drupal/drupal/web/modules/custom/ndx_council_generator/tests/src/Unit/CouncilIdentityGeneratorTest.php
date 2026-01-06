<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_council_generator\Unit;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\Core\Config\Config;
use Drupal\Core\Extension\ModuleExtensionList;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_council_generator\Generator\CouncilIdentityGenerator;
use Drupal\ndx_council_generator\Service\GenerationStateManagerInterface;
use Drupal\ndx_council_generator\Value\CouncilIdentity;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;

/**
 * Unit tests for CouncilIdentityGenerator.
 *
 * @coversDefaultClass \Drupal\ndx_council_generator\Generator\CouncilIdentityGenerator
 * @group ndx_council_generator
 *
 * Story 5.2: Council Identity Generator
 */
class CouncilIdentityGeneratorTest extends TestCase {

  /**
   * Mock Bedrock service.
   *
   * @var \Drupal\ndx_aws_ai\Service\BedrockServiceInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $bedrock;

  /**
   * Mock state manager.
   *
   * @var \Drupal\ndx_council_generator\Service\GenerationStateManagerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $stateManager;

  /**
   * Mock config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $configFactory;

  /**
   * Mock module extension list.
   *
   * @var \Drupal\Core\Extension\ModuleExtensionList|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $moduleExtensionList;

  /**
   * Mock logger.
   *
   * @var \Psr\Log\LoggerInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $logger;

  /**
   * The generator under test.
   *
   * @var \Drupal\ndx_council_generator\Generator\CouncilIdentityGenerator
   */
  protected CouncilIdentityGenerator $generator;

  /**
   * Path to the test module.
   *
   * @var string
   */
  protected string $modulePath;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->bedrock = $this->createMock(BedrockServiceInterface::class);
    $this->stateManager = $this->createMock(GenerationStateManagerInterface::class);
    $this->configFactory = $this->createMock(ConfigFactoryInterface::class);
    $this->moduleExtensionList = $this->createMock(ModuleExtensionList::class);
    $this->logger = $this->createMock(LoggerInterface::class);

    // Set up module path to point to real prompts directory.
    $this->modulePath = dirname(__DIR__, 4);
    $this->moduleExtensionList->method('getPath')
      ->with('ndx_council_generator')
      ->willReturn($this->modulePath);

    $this->generator = new CouncilIdentityGenerator(
      $this->bedrock,
      $this->stateManager,
      $this->configFactory,
      $this->moduleExtensionList,
      $this->logger,
    );
  }

  /**
   * Test successful generation with valid AI response.
   *
   * @covers ::generate
   */
  public function testGenerateSuccess(): void {
    $aiResponse = json_encode([
      'name' => 'Thornbridge District Council',
      'regionKey' => 'yorkshire',
      'themeKey' => 'market_town',
      'populationRange' => 'medium',
      'populationEstimate' => 45000,
      'flavourKeywords' => ['wool trade', 'market square', 'stone bridges'],
      'motto' => 'Service with Pride',
    ]);

    $this->bedrock->expects($this->once())
      ->method('generateContent')
      ->with($this->stringContains('Generate a realistic but entirely fictional council'), BedrockServiceInterface::MODEL_NOVA_PRO)
      ->willReturn($aiResponse);

    // Mock config for saving.
    $config = $this->createMock(Config::class);
    $config->expects($this->once())
      ->method('setData')
      ->willReturnSelf();
    $config->expects($this->once())
      ->method('save');

    $this->configFactory->expects($this->once())
      ->method('getEditable')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $this->stateManager->expects($this->once())
      ->method('setIdentity')
      ->with($this->callback(function ($identity) {
        return $identity['name'] === 'Thornbridge District Council';
      }));

    $this->logger->expects($this->exactly(3))
      ->method('info');

    $identity = $this->generator->generate();

    $this->assertEquals('Thornbridge District Council', $identity->name);
    $this->assertEquals('yorkshire', $identity->regionKey);
    $this->assertEquals('market_town', $identity->themeKey);
    $this->assertEquals('medium', $identity->populationRange);
  }

  /**
   * Test generation with region preference.
   *
   * @covers ::generate
   */
  public function testGenerateWithRegionPreference(): void {
    $aiResponse = json_encode([
      'name' => 'Glenhaven Council',
      'regionKey' => 'scotland',
      'themeKey' => 'rural_agricultural',
      'populationRange' => 'small',
      'populationEstimate' => 22000,
      'flavourKeywords' => ['highland cattle'],
      'motto' => 'Pride in Heritage',
    ]);

    $this->bedrock->expects($this->once())
      ->method('generateContent')
      ->with($this->stringContains('Preferred region: scotland'), BedrockServiceInterface::MODEL_NOVA_PRO)
      ->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    $identity = $this->generator->generate(['region' => 'scotland']);

    $this->assertEquals('scotland', $identity->regionKey);
  }

  /**
   * Test generation with theme preference.
   *
   * @covers ::generate
   */
  public function testGenerateWithThemePreference(): void {
    $aiResponse = json_encode([
      'name' => 'Seaside Borough Council',
      'regionKey' => 'south_west',
      'themeKey' => 'coastal_tourism',
      'populationRange' => 'medium',
      'populationEstimate' => 55000,
      'flavourKeywords' => ['sandy beaches', 'fishing boats'],
      'motto' => 'By Sea and Sand',
    ]);

    $this->bedrock->expects($this->once())
      ->method('generateContent')
      ->with($this->stringContains('Preferred theme: coastal_tourism'), BedrockServiceInterface::MODEL_NOVA_PRO)
      ->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    $identity = $this->generator->generate(['theme' => 'coastal_tourism']);

    $this->assertEquals('coastal_tourism', $identity->themeKey);
  }

  /**
   * Test generation handles invalid region from AI.
   *
   * @covers ::generate
   */
  public function testGenerateNormalizesInvalidRegion(): void {
    $aiResponse = json_encode([
      'name' => 'Test Council',
      'regionKey' => 'invalid_region',
      'themeKey' => 'market_town',
      'populationRange' => 'medium',
      'populationEstimate' => 45000,
      'flavourKeywords' => [],
      'motto' => 'Test',
    ]);

    $this->bedrock->method('generateContent')->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    $this->logger->expects($this->once())
      ->method('warning')
      ->with($this->stringContains('Invalid region'));

    $identity = $this->generator->generate();

    // Should default to east_midlands.
    $this->assertEquals('east_midlands', $identity->regionKey);
  }

  /**
   * Test generation handles invalid theme from AI.
   *
   * @covers ::generate
   */
  public function testGenerateNormalizesInvalidTheme(): void {
    $aiResponse = json_encode([
      'name' => 'Test Council',
      'regionKey' => 'yorkshire',
      'themeKey' => 'invalid_theme',
      'populationRange' => 'medium',
      'populationEstimate' => 45000,
      'flavourKeywords' => [],
      'motto' => 'Test',
    ]);

    $this->bedrock->method('generateContent')->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    $this->logger->expects($this->once())
      ->method('warning')
      ->with($this->stringContains('Invalid theme'));

    $identity = $this->generator->generate();

    // Should default to market_town.
    $this->assertEquals('market_town', $identity->themeKey);
  }

  /**
   * Test generation throws on missing required fields.
   *
   * @covers ::generate
   */
  public function testGenerateThrowsOnMissingName(): void {
    $aiResponse = json_encode([
      'regionKey' => 'yorkshire',
      'themeKey' => 'market_town',
      'populationRange' => 'medium',
    ]);

    $this->bedrock->method('generateContent')->willReturn($aiResponse);

    $this->expectException(\RuntimeException::class);
    $this->expectExceptionMessage('Missing required field: name');

    $this->generator->generate();
  }

  /**
   * Test generation throws on invalid JSON.
   *
   * @covers ::generate
   */
  public function testGenerateThrowsOnInvalidJson(): void {
    $this->bedrock->method('generateContent')->willReturn('Not valid JSON at all');

    $this->expectException(\RuntimeException::class);
    $this->expectExceptionMessage('No JSON found in AI response');

    $this->generator->generate();
  }

  /**
   * Test generation throws on malformed JSON.
   *
   * @covers ::generate
   */
  public function testGenerateThrowsOnMalformedJson(): void {
    $this->bedrock->method('generateContent')->willReturn('{invalid json}');

    $this->expectException(\RuntimeException::class);
    $this->expectExceptionMessage('Invalid JSON in AI response');

    $this->generator->generate();
  }

  /**
   * Test generation handles JSON embedded in markdown.
   *
   * @covers ::generate
   */
  public function testGenerateExtractsJsonFromMarkdown(): void {
    $aiResponse = "Here is the council identity:\n\n```json\n" . json_encode([
      'name' => 'Markdown Council',
      'regionKey' => 'london',
      'themeKey' => 'university_city',
      'populationRange' => 'large',
      'populationEstimate' => 200000,
      'flavourKeywords' => ['research', 'innovation'],
      'motto' => 'Knowledge is Power',
    ]) . "\n```\n\nThis should work!";

    $this->bedrock->method('generateContent')->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    $identity = $this->generator->generate();

    $this->assertEquals('Markdown Council', $identity->name);
  }

  /**
   * Test saveIdentity stores in config.
   *
   * @covers ::saveIdentity
   */
  public function testSaveIdentity(): void {
    $identity = CouncilIdentity::createDefault();

    $config = $this->createMock(Config::class);
    $config->expects($this->once())
      ->method('setData')
      ->with($identity->toArray())
      ->willReturnSelf();
    $config->expects($this->once())
      ->method('save');

    $this->configFactory->expects($this->once())
      ->method('getEditable')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('saved'));

    $this->generator->saveIdentity($identity);
  }

  /**
   * Test loadIdentity returns identity from config.
   *
   * @covers ::loadIdentity
   */
  public function testLoadIdentity(): void {
    $data = [
      'name' => 'Stored Council',
      'regionKey' => 'wales',
      'themeKey' => 'mining_legacy',
      'populationRange' => 'medium',
      'populationEstimate' => 60000,
      'flavourKeywords' => ['coal', 'valleys'],
      'motto' => 'From the Valleys',
      'generatedAt' => 1703851200,
    ];

    $config = $this->createMock(ImmutableConfig::class);
    $config->method('getRawData')->willReturn($data);

    $this->configFactory->method('get')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $identity = $this->generator->loadIdentity();

    $this->assertNotNull($identity);
    $this->assertEquals('Stored Council', $identity->name);
    $this->assertEquals('wales', $identity->regionKey);
  }

  /**
   * Test loadIdentity returns null when no identity stored.
   *
   * @covers ::loadIdentity
   */
  public function testLoadIdentityReturnsNullWhenEmpty(): void {
    $config = $this->createMock(ImmutableConfig::class);
    $config->method('getRawData')->willReturn([]);

    $this->configFactory->method('get')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $identity = $this->generator->loadIdentity();

    $this->assertNull($identity);
  }

  /**
   * Test hasIdentity returns true when identity exists.
   *
   * @covers ::hasIdentity
   */
  public function testHasIdentityReturnsTrue(): void {
    $config = $this->createMock(ImmutableConfig::class);
    $config->method('getRawData')->willReturn(['name' => 'Test Council']);

    $this->configFactory->method('get')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $this->assertTrue($this->generator->hasIdentity());
  }

  /**
   * Test hasIdentity returns false when no identity.
   *
   * @covers ::hasIdentity
   */
  public function testHasIdentityReturnsFalse(): void {
    $config = $this->createMock(ImmutableConfig::class);
    $config->method('getRawData')->willReturn([]);

    $this->configFactory->method('get')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    $this->assertFalse($this->generator->hasIdentity());
  }

  /**
   * Test clearIdentity deletes config and clears state.
   *
   * @covers ::clearIdentity
   */
  public function testClearIdentity(): void {
    $config = $this->createMock(Config::class);
    $config->expects($this->once())
      ->method('delete');

    $this->configFactory->expects($this->once())
      ->method('getEditable')
      ->with(CouncilIdentityGenerator::CONFIG_KEY)
      ->willReturn($config);

    // Verify state manager is also cleared.
    $this->stateManager->expects($this->once())
      ->method('setIdentity')
      ->with([]);

    $this->logger->expects($this->once())
      ->method('info')
      ->with($this->stringContains('cleared'));

    $this->generator->clearIdentity();
  }

  /**
   * Test generation logs token usage.
   *
   * @covers ::generate
   */
  public function testGenerateLogsTokenUsage(): void {
    $aiResponse = json_encode([
      'name' => 'Test Council',
      'regionKey' => 'yorkshire',
      'themeKey' => 'market_town',
      'populationRange' => 'medium',
      'populationEstimate' => 45000,
      'flavourKeywords' => ['test'],
      'motto' => 'Test',
    ]);

    $this->bedrock->method('generateContent')->willReturn($aiResponse);

    $config = $this->createMock(Config::class);
    $config->method('setData')->willReturnSelf();
    $config->method('save');
    $this->configFactory->method('getEditable')->willReturn($config);

    // Track logged messages.
    $loggedMessages = [];
    $this->logger->expects($this->exactly(3))
      ->method('info')
      ->willReturnCallback(function ($message) use (&$loggedMessages) {
        $loggedMessages[] = $message;
      });

    $this->generator->generate();

    // Verify token usage was logged.
    $this->assertContains(
      'Council identity generation token usage',
      $loggedMessages,
      'Token usage should be logged'
    );
  }

  /**
   * Test generation logs error on Bedrock failure.
   *
   * @covers ::generate
   */
  public function testGenerateLogsErrorOnBedrockFailure(): void {
    $exception = new \Exception('Bedrock API error');

    $this->bedrock->method('generateContent')
      ->willThrowException($exception);

    $this->logger->expects($this->once())
      ->method('error')
      ->with(
        $this->stringContains('generation failed'),
        $this->callback(function ($context) {
          return $context['error'] === 'Bedrock API error';
        })
      );

    $this->expectException(\Exception::class);
    $this->expectExceptionMessage('Bedrock API error');

    $this->generator->generate();
  }

}
