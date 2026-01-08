<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;

/**
 * Configure AWS AI settings for the NDX platform.
 *
 * Story 3.1: ndx_aws_ai Module Foundation
 */
class AwsSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'ndx_aws_ai_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['ndx_aws_ai.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('ndx_aws_ai.settings');

    $form['aws_region'] = [
      '#type' => 'select',
      '#title' => $this->t('AWS Region'),
      '#description' => $this->t('Select the AWS region for AI services. This should match the region where your infrastructure is deployed.'),
      '#default_value' => $config->get('aws_region') ?? 'us-east-1',
      '#options' => $this->getAwsRegions(),
      '#required' => TRUE,
    ];

    $form['credentials_info'] = [
      '#type' => 'details',
      '#title' => $this->t('Credential Information'),
      '#open' => TRUE,
    ];

    $form['credentials_info']['info'] = [
      '#markup' => '<p>' . $this->t('AWS credentials are automatically obtained from the ECS task IAM role. No manual configuration is required.') . '</p>' .
        '<p>' . $this->t('The task role provides access to:') . '</p>' .
        '<ul>' .
        '<li>' . $this->t('Amazon Bedrock (Nova 2 models)') . '</li>' .
        '<li>' . $this->t('Amazon Polly (Neural TTS)') . '</li>' .
        '<li>' . $this->t('Amazon Translate') . '</li>' .
        '<li>' . $this->t('Amazon Rekognition') . '</li>' .
        '<li>' . $this->t('Amazon Textract') . '</li>' .
        '</ul>',
    ];

    $form['actions']['test_connection'] = [
      '#type' => 'link',
      '#title' => $this->t('Test AWS Connection'),
      '#url' => Url::fromRoute('ndx_aws_ai.connection_test'),
      '#attributes' => [
        'class' => ['button'],
      ],
      '#weight' => 10,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config('ndx_aws_ai.settings')
      ->set('aws_region', $form_state->getValue('aws_region'))
      ->save();

    parent::submitForm($form, $form_state);
  }

  /**
   * Get available AWS regions.
   *
   * @return array
   *   Array of region codes to region names.
   */
  protected function getAwsRegions(): array {
    return [
      'us-east-1' => $this->t('US East (N. Virginia) - us-east-1'),
      'us-east-2' => $this->t('US East (Ohio) - us-east-2'),
      'us-west-1' => $this->t('US West (N. California) - us-west-1'),
      'us-west-2' => $this->t('US West (Oregon) - us-west-2'),
      'eu-west-1' => $this->t('EU (Ireland) - eu-west-1'),
      'eu-west-2' => $this->t('EU (London) - eu-west-2'),
      'eu-central-1' => $this->t('EU (Frankfurt) - eu-central-1'),
      'ap-northeast-1' => $this->t('Asia Pacific (Tokyo) - ap-northeast-1'),
      'ap-southeast-1' => $this->t('Asia Pacific (Singapore) - ap-southeast-1'),
      'ap-southeast-2' => $this->t('Asia Pacific (Sydney) - ap-southeast-2'),
    ];
  }

}
