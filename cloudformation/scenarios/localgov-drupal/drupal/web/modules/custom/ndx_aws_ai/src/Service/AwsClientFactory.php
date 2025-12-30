<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Service;

use Aws\BedrockRuntime\BedrockRuntimeClient;
use Aws\Polly\PollyClient;
use Aws\Rekognition\RekognitionClient;
use Aws\Sts\StsClient;
use Aws\Textract\TextractClient;
use Aws\Translate\TranslateClient;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Logger\LoggerChannelFactoryInterface;
use Psr\Log\LoggerInterface;

/**
 * Factory service for creating AWS SDK clients.
 *
 * Uses IAM role credentials from ECS task role - no hardcoded credentials.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
class AwsClientFactory {

  /**
   * The AWS region.
   */
  protected string $region;

  /**
   * The logger.
   */
  protected LoggerInterface $logger;

  /**
   * Cache for instantiated clients.
   *
   * @var array<string, object>
   */
  protected array $clientCache = [];

  /**
   * Constructs an AwsClientFactory.
   *
   * @param \Drupal\Core\Config\ConfigFactoryInterface $configFactory
   *   The config factory.
   * @param \Drupal\Core\Logger\LoggerChannelFactoryInterface $loggerFactory
   *   The logger factory.
   */
  public function __construct(
    protected ConfigFactoryInterface $configFactory,
    LoggerChannelFactoryInterface $loggerFactory,
  ) {
    $config = $this->configFactory->get('ndx_aws_ai.settings');
    $this->region = $config->get('aws_region') ?? 'us-east-1';
    $this->logger = $loggerFactory->get('ndx_aws_ai');
  }

  /**
   * Get the base configuration for AWS clients.
   *
   * Credentials are automatically obtained from the ECS task IAM role
   * via the SDK's default credential provider chain.
   *
   * @return array<string, mixed>
   *   The base configuration array.
   */
  protected function getBaseConfig(): array {
    return [
      'region' => $this->region,
      'version' => 'latest',
      // No credentials specified - SDK uses IAM role from ECS task
    ];
  }

  /**
   * Get a Bedrock Runtime client.
   *
   * @return \Aws\BedrockRuntime\BedrockRuntimeClient
   *   The Bedrock Runtime client.
   */
  public function getBedrockClient(): BedrockRuntimeClient {
    if (!isset($this->clientCache['bedrock'])) {
      $this->logger->debug('Creating new Bedrock Runtime client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['bedrock'] = new BedrockRuntimeClient($this->getBaseConfig());
    }
    return $this->clientCache['bedrock'];
  }

  /**
   * Get a Polly client.
   *
   * @return \Aws\Polly\PollyClient
   *   The Polly client.
   */
  public function getPollyClient(): PollyClient {
    if (!isset($this->clientCache['polly'])) {
      $this->logger->debug('Creating new Polly client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['polly'] = new PollyClient($this->getBaseConfig());
    }
    return $this->clientCache['polly'];
  }

  /**
   * Get a Translate client.
   *
   * @return \Aws\Translate\TranslateClient
   *   The Translate client.
   */
  public function getTranslateClient(): TranslateClient {
    if (!isset($this->clientCache['translate'])) {
      $this->logger->debug('Creating new Translate client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['translate'] = new TranslateClient($this->getBaseConfig());
    }
    return $this->clientCache['translate'];
  }

  /**
   * Get a Rekognition client.
   *
   * @return \Aws\Rekognition\RekognitionClient
   *   The Rekognition client.
   */
  public function getRekognitionClient(): RekognitionClient {
    if (!isset($this->clientCache['rekognition'])) {
      $this->logger->debug('Creating new Rekognition client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['rekognition'] = new RekognitionClient($this->getBaseConfig());
    }
    return $this->clientCache['rekognition'];
  }

  /**
   * Get a Textract client.
   *
   * @return \Aws\Textract\TextractClient
   *   The Textract client.
   */
  public function getTextractClient(): TextractClient {
    if (!isset($this->clientCache['textract'])) {
      $this->logger->debug('Creating new Textract client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['textract'] = new TextractClient($this->getBaseConfig());
    }
    return $this->clientCache['textract'];
  }

  /**
   * Get an STS client for connection testing.
   *
   * @return \Aws\Sts\StsClient
   *   The STS client.
   */
  public function getStsClient(): StsClient {
    if (!isset($this->clientCache['sts'])) {
      $this->logger->debug('Creating new STS client for region @region', [
        '@region' => $this->region,
      ]);
      $this->clientCache['sts'] = new StsClient($this->getBaseConfig());
    }
    return $this->clientCache['sts'];
  }

  /**
   * Get the configured AWS region.
   *
   * @return string
   *   The AWS region code.
   */
  public function getRegion(): string {
    return $this->region;
  }

  /**
   * Clear the client cache.
   *
   * Useful when region configuration changes.
   */
  public function clearCache(): void {
    $this->clientCache = [];
    $config = $this->configFactory->get('ndx_aws_ai.settings');
    $this->region = $config->get('aws_region') ?? 'us-east-1';
  }

}
