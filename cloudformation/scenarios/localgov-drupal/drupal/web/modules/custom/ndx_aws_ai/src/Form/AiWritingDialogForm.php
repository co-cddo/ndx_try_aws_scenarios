<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Drupal\ndx_aws_ai\Service\PromptHistoryService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * AI Writing Dialog form for content generation.
 *
 * Story 3.5: AI Writing Assistant
 *
 * Provides a form for users to enter prompts and generate AI content
 * that can be inserted into CKEditor.
 */
class AiWritingDialogForm extends FormBase {

  /**
   * Constructs an AiWritingDialogForm.
   *
   * @param \Drupal\ndx_aws_ai\Service\BedrockServiceInterface $bedrockService
   *   The Bedrock service.
   * @param \Drupal\ndx_aws_ai\Service\PromptHistoryService $promptHistory
   *   The prompt history service.
   * @param \Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager $promptManager
   *   The prompt template manager.
   */
  public function __construct(
    protected BedrockServiceInterface $bedrockService,
    protected PromptHistoryService $promptHistory,
    protected PromptTemplateManager $promptManager,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.bedrock'),
      $container->get('ndx_aws_ai.prompt_history'),
      $container->get('ndx_aws_ai.prompt_template_manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_aws_ai_writing_dialog_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['#prefix'] = '<div id="ai-writing-dialog-wrapper" class="ai-writing-dialog">';
    $form['#suffix'] = '</div>';

    // Attach library for styling.
    $form['#attached']['library'][] = 'ndx_aws_ai/ai_components';
    $form['#attached']['library'][] = 'ndx_aws_ai/ai_writing_dialog';

    // Prompt history dropdown.
    $history_options = $this->promptHistory->getHistoryAsOptions();
    if (!empty($history_options)) {
      $form['prompt_history'] = [
        '#type' => 'select',
        '#title' => $this->t('Recent prompts'),
        '#options' => $history_options,
        '#empty_option' => $this->t('- Select a recent prompt -'),
        '#attributes' => [
          'class' => ['ai-prompt-history'],
          'aria-describedby' => 'prompt-history-help',
        ],
      ];
      $form['prompt_history_help'] = [
        '#type' => 'html_tag',
        '#tag' => 'p',
        '#value' => $this->t('Or select a prompt you used before.'),
        '#attributes' => [
          'id' => 'prompt-history-help',
          'class' => ['ai-help-text'],
        ],
      ];
    }

    // Main prompt input.
    $form['prompt'] = [
      '#type' => 'textarea',
      '#title' => $this->t('What would you like me to write?'),
      '#placeholder' => $this->t('e.g., Write an introduction about council tax bands explaining how they work and what factors determine which band a property is in.'),
      '#required' => TRUE,
      '#rows' => 4,
      '#attributes' => [
        'class' => ['ai-prompt-input'],
        'aria-describedby' => 'prompt-help',
      ],
    ];
    $form['prompt_help'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $this->t('Be specific about what you need. The AI will write content suitable for a council website.'),
      '#attributes' => [
        'id' => 'prompt-help',
        'class' => ['ai-help-text'],
      ],
    ];

    // Preview container (initially hidden).
    $form['preview_container'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'ai-preview-container',
        'class' => ['ai-preview-container', 'ai-hidden'],
      ],
    ];

    $form['preview_container']['preview_label'] = [
      '#type' => 'html_tag',
      '#tag' => 'h3',
      '#value' => $this->t('Generated content'),
      '#attributes' => ['class' => ['ai-preview-label']],
    ];

    $form['preview_container']['generated_content'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Edit the generated content'),
      '#title_display' => 'invisible',
      '#rows' => 8,
      '#attributes' => [
        'class' => ['ai-generated-content'],
        'aria-label' => $this->t('Generated content - you can edit this before applying'),
      ],
    ];

    // Loading indicator.
    $form['loading'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'ai-loading-indicator',
        'class' => ['ai-loading-state', 'ai-hidden'],
        'role' => 'status',
        'aria-live' => 'polite',
      ],
    ];
    $form['loading']['spinner'] = [
      '#markup' => '<div class="ai-spinner" aria-hidden="true"></div>',
    ];
    $form['loading']['message'] = [
      '#markup' => '<span class="ai-loading-message">' . $this->t('AI is writing your content...') . '</span>',
    ];

    // Error container.
    $form['error'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'ai-error-container',
        'class' => ['ai-error-state', 'ai-hidden'],
        'role' => 'alert',
      ],
    ];

    // Actions.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['generate'] = [
      '#type' => 'submit',
      '#value' => $this->t('Generate'),
      '#attributes' => [
        'class' => ['ai-action-button', 'ai-action-button--primary'],
      ],
      '#ajax' => [
        'callback' => '::generateContent',
        'wrapper' => 'ai-writing-dialog-wrapper',
        'progress' => [
          'type' => 'none',
        ],
      ],
    ];

    $form['actions']['apply'] = [
      '#type' => 'button',
      '#value' => $this->t('Apply'),
      '#weight' => -10,
      '#attributes' => [
        'class' => ['ai-action-button', 'ai-action-button--primary', 'ai-hidden'],
        'id' => 'ai-apply-button',
        'data-action' => 'apply',
      ],
    ];

    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#weight' => 10,
      '#attributes' => [
        'class' => ['ai-action-button'],
        'data-action' => 'cancel',
      ],
    ];

    return $form;
  }

  /**
   * AJAX callback to generate content.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   The AJAX response.
   */
  public function generateContent(array &$form, FormStateInterface $form_state): AjaxResponse {
    $response = new AjaxResponse();
    $prompt = trim($form_state->getValue('prompt', ''));

    if (empty($prompt)) {
      // Show error for empty prompt.
      $error_html = '<div class="ai-error-message">' . $this->t('Please enter a prompt.') . '</div>';
      $response->addCommand(new HtmlCommand('#ai-error-container', $error_html));
      $response->addCommand(new InvokeCommand('#ai-error-container', 'removeClass', ['ai-hidden']));
      return $response;
    }

    try {
      // Add to history.
      $this->promptHistory->addPrompt($prompt);

      // Load prompt template and generate content.
      $template = $this->promptManager->loadTemplate('writing');
      $userPrompt = $this->promptManager->render($template, ['prompt' => $prompt]);
      $systemPrompt = $this->promptManager->renderSystem($template, []);

      $generatedContent = $this->bedrockService->generateContent(
        prompt: $userPrompt,
        model: BedrockServiceInterface::MODEL_NOVA_PRO,
        options: [
          'systemPrompt' => $systemPrompt,
          'maxTokens' => $template['parameters']['maxTokens'] ?? 1024,
          'temperature' => $template['parameters']['temperature'] ?? 0.7,
        ],
      );

      // Update form with generated content.
      $response->addCommand(new InvokeCommand('#ai-loading-indicator', 'addClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('#ai-error-container', 'addClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('#ai-preview-container', 'removeClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('.ai-generated-content', 'val', [$generatedContent]));
      $response->addCommand(new InvokeCommand('#ai-apply-button', 'removeClass', ['ai-hidden']));
      // Change Generate button to Regenerate after first generation.
      $response->addCommand(new InvokeCommand('#edit-generate', 'val', [$this->t('Regenerate')]));
      $response->addCommand(new InvokeCommand('#edit-generate', 'removeClass', ['ai-action-button--primary']));

      // Focus on generated content.
      $response->addCommand(new InvokeCommand('.ai-generated-content', 'focus', []));

      // Announce to screen readers.
      $response->addCommand(new InvokeCommand(NULL, 'ndxAwsAiAnnounce', [
        $this->t('Content generated successfully. You can edit it before applying.'),
        'polite',
      ]));

    }
    catch (\Exception $e) {
      // Show error.
      $error_html = '<div class="ai-error-message">' .
        $this->t('Unable to generate content. Please try again.') .
        '</div>';
      $response->addCommand(new HtmlCommand('#ai-error-container', $error_html));
      $response->addCommand(new InvokeCommand('#ai-error-container', 'removeClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('#ai-loading-indicator', 'addClass', ['ai-hidden']));

      // Log error.
      $this->getLogger('ndx_aws_ai')->error(
        'AI content generation failed: @message',
        ['@message' => $e->getMessage()]
      );
    }

    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // Form submission is handled via AJAX.
  }

}
