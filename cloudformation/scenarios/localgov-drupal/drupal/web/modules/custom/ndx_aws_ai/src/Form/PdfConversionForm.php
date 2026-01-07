<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form for uploading and converting PDFs to web content.
 *
 * Provides a user-friendly interface for uploading PDF documents
 * and converting them to accessible HTML content.
 *
 * Story 4.8: PDF-to-Web Conversion
 */
class PdfConversionForm extends FormBase {

  /**
   * Maximum file size for upload (5MB).
   */
  private const MAX_UPLOAD_SIZE_MB = 5;

  /**
   * The PDF conversion service.
   *
   * Note: Not using readonly constructor promotion to avoid PHP 8.2
   * serialization issues during Drupal AJAX form rebuilds.
   *
   * @var \Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface|null
   */
  protected ?PdfConversionServiceInterface $conversionService = NULL;

  /**
   * Constructs a PdfConversionForm.
   *
   * @param \Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface|null $conversionService
   *   The PDF conversion service.
   */
  public function __construct(?PdfConversionServiceInterface $conversionService = NULL) {
    $this->conversionService = $conversionService;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.pdf_conversion'),
    );
  }

  /**
   * Gets the PDF conversion service.
   *
   * Handles re-initialization after form unserialization during AJAX rebuilds.
   *
   * @return \Drupal\ndx_aws_ai\Service\PdfConversionServiceInterface
   *   The conversion service.
   */
  protected function getConversionService(): PdfConversionServiceInterface {
    if ($this->conversionService === NULL) {
      $this->conversionService = \Drupal::service('ndx_aws_ai.pdf_conversion');
    }
    return $this->conversionService;
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_aws_ai_pdf_conversion_form';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    // Check service availability.
    if (!$this->getConversionService()->isAvailable()) {
      $form['warning'] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['messages', 'messages--warning']],
        'message' => [
          '#markup' => $this->t('PDF conversion service is not available. Please check AWS configuration.'),
        ],
      ];
      return $form;
    }

    $form['#attributes']['class'][] = 'ndx-pdf-conversion-form';

    // Description.
    $form['description'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['form-description']],
      'text' => [
        '#markup' => '<p>' . $this->t('Upload a PDF document to convert it to accessible web content. The AI will extract text, structure it with proper headings, and convert any tables to accessible HTML.') . '</p>',
      ],
    ];

    // File upload.
    $form['pdf_file'] = [
      '#type' => 'managed_file',
      '#title' => $this->t('PDF Document'),
      '#description' => $this->t('Upload a PDF file (maximum @size MB).', [
        '@size' => self::MAX_UPLOAD_SIZE_MB,
      ]),
      '#upload_location' => 'public://pdf_conversion/',
      // Temporarily using minimal validators for debugging.
      // Note: Drupal 10 uses constraint-based validators.
      '#upload_validators' => [
        'FileExtension' => ['extensions' => 'pdf'],
      ],
      '#required' => TRUE,
    ];

    // Title for the new page.
    $form['page_title'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Page Title'),
      '#description' => $this->t('Title for the new web page that will be created.'),
      '#required' => TRUE,
      '#maxlength' => 255,
    ];

    // Progress container (hidden initially).
    $form['progress_container'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'pdf-conversion-progress',
        'class' => ['ndx-pdf-progress', 'js-hide'],
        'aria-live' => 'polite',
      ],
      'status' => [
        '#type' => 'container',
        '#attributes' => ['class' => ['progress-status']],
        'text' => [
          '#markup' => '<span class="progress-step" data-progress-step></span>',
        ],
      ],
      'bar' => [
        '#type' => 'container',
        '#attributes' => ['class' => ['progress-bar-wrapper']],
        'inner' => [
          '#markup' => '<div class="progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" data-progress-bar><div class="progress-bar-fill"></div></div>',
        ],
      ],
    ];

    // Result container (hidden initially).
    $form['result_container'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'pdf-conversion-result',
        'class' => ['ndx-pdf-result', 'js-hide'],
      ],
      'preview' => [
        '#type' => 'container',
        '#attributes' => ['class' => ['result-preview']],
        'label' => [
          '#markup' => '<h3>' . $this->t('Preview') . '</h3>',
        ],
        'content' => [
          '#type' => 'container',
          '#attributes' => [
            'class' => ['preview-content'],
            'data-preview-content' => TRUE,
          ],
        ],
      ],
      'stats' => [
        '#type' => 'container',
        '#attributes' => ['class' => ['result-stats']],
        'content' => [
          '#markup' => '<ul class="stats-list" data-stats></ul>',
        ],
      ],
    ];

    // Error container (hidden initially).
    $form['error_container'] = [
      '#type' => 'container',
      '#attributes' => [
        'id' => 'pdf-conversion-error',
        'class' => ['messages', 'messages--error', 'js-hide'],
        'role' => 'alert',
      ],
      'message' => [
        '#markup' => '<span data-error-message></span>',
      ],
    ];

    // Submit button.
    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['submit'] = [
      '#type' => 'submit',
      '#value' => $this->t('Convert PDF'),
      '#attributes' => [
        'class' => ['button', 'button--primary'],
      ],
    ];

    $form['actions']['create_draft'] = [
      '#type' => 'submit',
      '#value' => $this->t('Create Draft Page'),
      '#attributes' => [
        'class' => ['button', 'js-hide'],
        'data-create-draft' => TRUE,
      ],
      '#submit' => ['::createDraftPage'],
    ];

    // Attach library.
    $form['#attached']['library'][] = 'ndx_aws_ai/pdf-conversion';
    $form['#attached']['drupalSettings']['ndxPdfConversion'] = [
      'endpoint' => Url::fromRoute('ndx_aws_ai.pdf.convert')->toString(),
      'createNodeEndpoint' => Url::fromRoute('ndx_aws_ai.pdf.create_node')->toString(),
      'maxSizeMb' => self::MAX_UPLOAD_SIZE_MB,
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {
    parent::validateForm($form, $form_state);

    // Validate file was uploaded.
    $fileIds = $form_state->getValue('pdf_file');
    if (empty($fileIds)) {
      $form_state->setErrorByName('pdf_file', $this->t('Please upload a PDF file.'));
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    // The actual conversion is handled via JavaScript/AJAX.
    // This submit handler is a fallback for non-JS users.
    $fileIds = $form_state->getValue('pdf_file');
    $title = $form_state->getValue('page_title');

    if (!empty($fileIds)) {
      $fileId = reset($fileIds);

      try {
        $jobId = $this->getConversionService()->startConversion((int) $fileId);

        // Store job ID in session for status checking.
        $this->messenger()->addStatus(
          $this->t('PDF conversion started. Job ID: @job', ['@job' => $jobId])
        );

        // Redirect to status page or form with job ID.
        $form_state->setRedirect('ndx_aws_ai.pdf.form', [], [
          'query' => ['job' => $jobId, 'title' => $title],
        ]);
      }
      catch (\Exception $e) {
        $this->messenger()->addError(
          $this->t('Failed to start conversion: @error', ['@error' => $e->getMessage()])
        );
      }
    }
  }

  /**
   * Submit handler for creating a draft page.
   *
   * @param array $form
   *   The form array.
   * @param \Drupal\Core\Form\FormStateInterface $form_state
   *   The form state.
   */
  public function createDraftPage(array &$form, FormStateInterface $form_state): void {
    // This is primarily handled via JavaScript.
    // Fallback for non-JS scenarios.
    $this->messenger()->addStatus(
      $this->t('Please use the JavaScript-enabled form to create draft pages.')
    );
  }

}
