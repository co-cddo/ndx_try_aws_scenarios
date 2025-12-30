<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Form;

use Aws\Exception\AwsException;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\ndx_aws_ai\Service\AwsClientFactory;
use Drupal\ndx_aws_ai\Service\AwsErrorHandler;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Form to test AWS connectivity using STS GetCallerIdentity.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
class AwsConnectionTestForm extends FormBase {

  /**
   * Constructs an AwsConnectionTestForm.
   *
   * @param \Drupal\ndx_aws_ai\Service\AwsClientFactory $clientFactory
   *   The AWS client factory.
   * @param \Drupal\ndx_aws_ai\Service\AwsErrorHandler $errorHandler
   *   The AWS error handler.
   */
  public function __construct(
    protected AwsClientFactory $clientFactory,
    protected AwsErrorHandler $errorHandler,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('ndx_aws_ai.client_factory'),
      $container->get('ndx_aws_ai.error_handler'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_aws_ai_connection_test';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['info'] = [
      '#markup' => '<p>' . $this->t('Click the button below to test connectivity to AWS using the ECS task IAM role.') . '</p>' .
        '<p>' . $this->t('Current region: <strong>@region</strong>', [
          '@region' => $this->clientFactory->getRegion(),
        ]) . '</p>',
    ];

    $form['actions'] = [
      '#type' => 'actions',
    ];

    $form['actions']['test'] = [
      '#type' => 'submit',
      '#value' => $this->t('Test Connection'),
      '#button_type' => 'primary',
    ];

    $form['actions']['back'] = [
      '#type' => 'link',
      '#title' => $this->t('Back to Settings'),
      '#url' => Url::fromRoute('ndx_aws_ai.settings'),
      '#attributes' => [
        'class' => ['button'],
      ],
    ];

    // Display test results if available.
    $results = $form_state->get('test_results');
    if ($results !== NULL) {
      $form['results'] = [
        '#type' => 'container',
        '#attributes' => [
          'class' => ['messages', $results['success'] ? 'messages--status' : 'messages--error'],
        ],
        '#weight' => -10,
      ];

      if ($results['success']) {
        $form['results']['message'] = [
          '#markup' => '<h3>' . $this->t('✓ Connection Successful') . '</h3>' .
            '<dl>' .
            '<dt>' . $this->t('Account ID') . '</dt>' .
            '<dd>' . $results['account'] . '</dd>' .
            '<dt>' . $this->t('User ARN') . '</dt>' .
            '<dd>' . $results['arn'] . '</dd>' .
            '<dt>' . $this->t('User ID') . '</dt>' .
            '<dd>' . $results['user_id'] . '</dd>' .
            '</dl>',
        ];
      }
      else {
        $form['results']['message'] = [
          '#markup' => '<h3>' . $this->t('✗ Connection Failed') . '</h3>' .
            '<p>' . $results['error'] . '</p>',
        ];
      }
    }

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    try {
      $stsClient = $this->clientFactory->getStsClient();
      $result = $stsClient->getCallerIdentity();

      $form_state->set('test_results', [
        'success' => TRUE,
        'account' => $result['Account'],
        'arn' => $result['Arn'],
        'user_id' => $result['UserId'],
      ]);

      $this->errorHandler->logOperation('STS', 'GetCallerIdentity', [
        'account' => $result['Account'],
        'arn' => $result['Arn'],
      ]);

      $this->messenger()->addStatus($this->t('AWS connection test successful.'));
    }
    catch (AwsException $e) {
      $exception = $this->errorHandler->handleException($e, 'STS', 'GetCallerIdentity');

      $form_state->set('test_results', [
        'success' => FALSE,
        'error' => $exception->getUserMessage(),
      ]);

      $this->messenger()->addError($exception->getUserMessage());
    }

    // Rebuild the form to show results.
    $form_state->setRebuild();
  }

}
