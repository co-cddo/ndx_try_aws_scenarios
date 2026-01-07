<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Controller for direct text simplification API.
 *
 * Provides a REST endpoint to simplify text using Bedrock,
 * returning the simplified text directly without a modal dialog.
 */
class SimplifyController extends ControllerBase {

  /**
   * Constructs a SimplifyController.
   *
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrockService
   *   The Bedrock service.
   * @param \Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager $promptManager
   *   The prompt template manager.
   */
  public function __construct(
    protected BedrockServiceInterface $bedrockService,
    protected PromptTemplateManager $promptManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.bedrock'),
      $container->get('ndx_aws_ai.prompt_template_manager'),
    );
  }

  /**
   * Simplify text to plain English.
   *
   * @param \Symfony\Component\HttpFoundation\Request $request
   *   The request containing text to simplify.
   *
   * @return \Symfony\Component\HttpFoundation\JsonResponse
   *   JSON response with simplified text or error.
   */
  public function simplify(Request $request): JsonResponse {
    // Parse JSON body.
    $content = $request->getContent();
    $data = json_decode($content, TRUE);

    if (!$data || empty($data['text'])) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('No text provided to simplify.')->render(),
      ], Response::HTTP_BAD_REQUEST);
    }

    $text = trim($data['text']);

    if (strlen($text) < 10) {
      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Text is too short to simplify.')->render(),
      ], Response::HTTP_BAD_REQUEST);
    }

    try {
      // Load prompt template and generate simplified content.
      $template = $this->promptManager->loadTemplate('simplify');
      $userPrompt = $this->promptManager->render($template, ['text' => $text]);
      $systemPrompt = $this->promptManager->renderSystem($template, []);

      $simplifiedContent = $this->bedrockService->generateContent(
        prompt: $userPrompt,
        model: BedrockServiceInterface::MODEL_NOVA_LITE,
        options: [
          'systemPrompt' => $systemPrompt,
          'maxTokens' => $template['parameters']['maxTokens'] ?? 1024,
          'temperature' => $template['parameters']['temperature'] ?? 0.3,
        ],
      );

      return new JsonResponse([
        'success' => TRUE,
        'simplified' => $simplifiedContent,
        'original_length' => strlen($text),
        'simplified_length' => strlen($simplifiedContent),
      ]);

    }
    catch (\Exception $e) {
      $this->getLogger('ndx_aws_ai')->error(
        'Text simplification failed: @message',
        ['@message' => $e->getMessage()]
      );

      return new JsonResponse([
        'success' => FALSE,
        'error' => $this->t('Unable to simplify text. Please try again.')->render(),
      ], Response::HTTP_INTERNAL_SERVER_ERROR);
    }
  }

}
