<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\ndx_aws_ai\PromptTemplate\PromptTemplateManager;
use Drupal\ndx_aws_ai\Service\BedrockServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * AI Simplify Dialog form for plain English simplification.
 *
 * Story 3.6: Readability Simplification
 *
 * Provides a form for users to simplify selected text to plain English
 * with before/after comparison and replacement in CKEditor.
 */
class AiSimplifyDialogForm extends FormBase {

  /**
   * The original text passed via query parameter.
   */
  protected string $originalText = '';

  /**
   * Constructs an AiSimplifyDialogForm.
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
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_aws_ai_simplify_dialog_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    // Get original text from query parameter or form state.
    // Note: Uses getRequest() inherited from FormBase instead of $this->requestStack
    // to avoid PHP 8.2 type conflict with parent class property.
    $request = $this->getRequest();
    $this->originalText = $form_state->get('original_text')
      ?? $request?->query->get('text', '')
      ?? '';

    // Store in form state for AJAX callbacks.
    $form_state->set('original_text', $this->originalText);

    $form['#prefix'] = '<div id="ai-simplify-dialog-wrapper" class="ai-simplify-dialog">';
    $form['#suffix'] = '</div>';

    // Attach libraries.
    $form['#attached']['library'][] = 'ndx_aws_ai/ai_components';
    $form['#attached']['library'][] = 'ndx_aws_ai/ai_simplify_dialog';
    $form['#attached']['library'][] = 'ndx_aws_ai/ai_diff_highlight';

    // Error if no text provided.
    if (empty(trim($this->originalText))) {
      $form['error'] = [
        '#type' => 'html_tag',
        '#tag' => 'div',
        '#value' => $this->t('Please select text in the editor before clicking "Simplify to plain English".'),
        '#attributes' => [
          'class' => ['ai-error-message'],
          'role' => 'alert',
        ],
      ];
      $form['actions'] = [
        '#type' => 'actions',
      ];
      $form['actions']['cancel'] = [
        '#type' => 'button',
        '#value' => $this->t('Close'),
        '#attributes' => [
          'class' => ['ai-action-button'],
          'data-action' => 'cancel',
        ],
      ];
      return $form;
    }

    // Diff toggle control.
    $form['diff_toggle'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['ai-diff-toggle'],
        'id' => 'ai-diff-toggle-container',
      ],
    ];
    $form['diff_toggle']['checkbox'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show changes highlighted'),
      '#default_value' => TRUE,
      '#attributes' => [
        'class' => ['ai-diff-toggle__checkbox'],
        'id' => 'ai-diff-toggle',
      ],
    ];

    // Comparison container.
    $form['comparison'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['ai-comparison-container', 'ai-diff-container', 'ai-diff-highlight-enabled'],
        'id' => 'ai-comparison-container',
      ],
    ];

    // Original text panel (left/top).
    $form['comparison']['original_panel'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['ai-comparison-panel', 'ai-comparison-original', 'ai-diff-panel', 'ai-diff-panel--original'],
      ],
    ];
    $form['comparison']['original_panel']['label'] = [
      '#type' => 'html_tag',
      '#tag' => 'h3',
      '#value' => $this->t('Original'),
      '#attributes' => ['class' => ['ai-comparison-label', 'ai-diff-panel-label']],
    ];
    // Diff view (shown when diff is enabled).
    $form['comparison']['original_panel']['diff_view'] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => '',
      '#attributes' => [
        'class' => ['ai-diff-original', 'ai-diff-view'],
        'id' => 'ai-diff-original',
        'aria-label' => $this->t('Original text with removed words highlighted'),
        'role' => 'region',
      ],
    ];
    // Hidden textarea for raw original text.
    $form['comparison']['original_panel']['original_text'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Original text'),
      '#title_display' => 'invisible',
      '#default_value' => $this->originalText,
      '#disabled' => TRUE,
      '#rows' => 8,
      '#attributes' => [
        'class' => ['ai-original-text', 'ai-text-source'],
        'aria-label' => $this->t('Original text - read only'),
        'readonly' => 'readonly',
      ],
    ];

    // Simplified text panel (right/bottom).
    $form['comparison']['simplified_panel'] = [
      '#type' => 'container',
      '#attributes' => [
        'class' => ['ai-comparison-panel', 'ai-comparison-simplified', 'ai-diff-panel', 'ai-diff-panel--modified'],
      ],
    ];
    $form['comparison']['simplified_panel']['label'] = [
      '#type' => 'html_tag',
      '#tag' => 'h3',
      '#value' => $this->t('Simplified'),
      '#attributes' => ['class' => ['ai-comparison-label', 'ai-diff-panel-label']],
    ];
    // Diff view (shown when diff is enabled).
    $form['comparison']['simplified_panel']['diff_view'] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => '',
      '#attributes' => [
        'class' => ['ai-diff-modified', 'ai-diff-view'],
        'id' => 'ai-diff-modified',
        'aria-label' => $this->t('Simplified text with added words highlighted'),
        'role' => 'region',
      ],
    ];
    // Editable textarea.
    $form['comparison']['simplified_panel']['simplified_text'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Simplified text'),
      '#title_display' => 'invisible',
      '#rows' => 8,
      '#attributes' => [
        'class' => ['ai-simplified-text', 'ai-text-source'],
        'aria-label' => $this->t('Simplified text - you can edit this before applying'),
      ],
    ];

    // Hidden field to store original text.
    $form['original_text_hidden'] = [
      '#type' => 'hidden',
      '#value' => $this->originalText,
    ];

    // Loading indicator.
    $form['loading'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'ai-simplify-loading',
        'class' => ['ai-loading-state'],
        'role' => 'status',
        'aria-live' => 'polite',
      ],
    ];
    $form['loading']['spinner'] = [
      '#markup' => '<div class="ai-spinner" aria-hidden="true"></div>',
    ];
    $form['loading']['message'] = [
      '#markup' => '<span class="ai-loading-message">' . $this->t('Simplifying text...') . '</span>',
    ];

    // Error container.
    $form['error_container'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'ai-simplify-error',
        'class' => ['ai-error-state', 'ai-hidden'],
        'role' => 'alert',
      ],
    ];

    // Actions.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    // Note: AJAX handling is done via JavaScript (ai-simplify-handler.js)
    // because Drupal's #ajax doesn't work reliably in modal dialogs.
    // The data-ajax-url provides the URL for the JavaScript AJAX binding.
    $form['actions']['regenerate'] = [
      '#type' => 'submit',
      '#value' => $this->t('Regenerate'),
      '#name' => 'regenerate',
      '#attributes' => [
        'class' => ['ai-action-button', 'js-form-submit'],
        'id' => 'ai-regenerate-button',
        'data-ajax-url' => '/ndx-aws-ai/simplify-dialog',
      ],
      // No #ajax - JavaScript handles it to avoid conflicts in modals.
    ];

    $form['actions']['apply'] = [
      '#type' => 'button',
      '#value' => $this->t('Apply'),
      '#attributes' => [
        'class' => ['ai-action-button', 'ai-action-button--primary', 'ai-hidden'],
        'id' => 'ai-simplify-apply-button',
        'data-action' => 'apply',
      ],
    ];

    $form['actions']['cancel'] = [
      '#type' => 'button',
      '#value' => $this->t('Cancel'),
      '#attributes' => [
        'class' => ['ai-action-button'],
        'data-action' => 'cancel',
      ],
    ];

    // Auto-trigger simplification on first load.
    if (!$form_state->isRebuilding()) {
      $form['#attached']['drupalSettings']['ndxAwsAi']['autoSimplify'] = TRUE;
    }

    return $form;
  }

  /**
   * AJAX callback to simplify content.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   *
   * @return \Drupal\Core\Ajax\AjaxResponse
   *   The AJAX response.
   */
  public function simplifyContent(array &$form, FormStateInterface $form_state): AjaxResponse {
    $response = new AjaxResponse();
    $originalText = $form_state->get('original_text') ?? '';

    if (empty(trim($originalText))) {
      $error_html = '<div class="ai-error-message">' . $this->t('No text to simplify.') . '</div>';
      $response->addCommand(new HtmlCommand('#ai-simplify-error', $error_html));
      $response->addCommand(new InvokeCommand('#ai-simplify-error', 'removeClass', ['ai-hidden']));
      return $response;
    }

    try {
      // Load prompt template and generate simplified content.
      $template = $this->promptManager->loadTemplate('simplify');
      $userPrompt = $this->promptManager->render($template, ['text' => $originalText]);
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

      // Update form with simplified content.
      $response->addCommand(new InvokeCommand('#ai-simplify-loading', 'addClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('#ai-simplify-error', 'addClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('.ai-simplified-text', 'val', [$simplifiedContent]));
      $response->addCommand(new InvokeCommand('.ai-simplified-text', 'prop', ['disabled', FALSE]));
      $response->addCommand(new InvokeCommand('#ai-simplify-apply-button', 'removeClass', ['ai-hidden']));

      // Trigger diff display update.
      $response->addCommand(new InvokeCommand(NULL, 'ndxAwsAiUpdateDiff', []));

      // Focus on simplified content (only if not in diff mode).
      $response->addCommand(new InvokeCommand('.ai-simplified-text', 'focus', []));

      // Announce to screen readers.
      $response->addCommand(new InvokeCommand(NULL, 'ndxAwsAiAnnounce', [
        $this->t('Text simplified. You can edit it before applying.'),
        'polite',
      ]));

    }
    catch (\Exception $e) {
      $error_html = '<div class="ai-error-message">' .
        $this->t('Unable to simplify text. Please try again.') .
        '</div>';
      $response->addCommand(new HtmlCommand('#ai-simplify-error', $error_html));
      $response->addCommand(new InvokeCommand('#ai-simplify-error', 'removeClass', ['ai-hidden']));
      $response->addCommand(new InvokeCommand('#ai-simplify-loading', 'addClass', ['ai-hidden']));

      // Log error.
      $this->getLogger('ndx_aws_ai')->error(
        'AI text simplification failed: @message',
        ['@message' => $e->getMessage()]
      );
    }

    return $response;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // Check if this is an AJAX request.
    $request = $this->getRequest();
    $isAjax = $request->isXmlHttpRequest() || $request->query->has('_drupal_ajax');

    if ($isAjax) {
      // Process and return AJAX response.
      $response = $this->simplifyContent($form, $form_state);
      $form_state->setResponse($response);
    }
    // Non-AJAX submissions just rebuild the form.
  }

}
