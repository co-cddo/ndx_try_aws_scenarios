<?php

declare(strict_types=1);

namespace Drupal\ndx_aws_ai\Plugin\CKEditor5Plugin;

use Drupal\ckeditor5\Plugin\CKEditor5PluginDefault;

/**
 * CKEditor 5 AI Toolbar plugin.
 *
 * Story 3.4: CKEditor AI Toolbar Plugin
 *
 * Provides AI-powered content editing features:
 * - "Help me write..." - AI content generation
 * - "Simplify to plain English" - Text simplification
 *
 * @CKEditor5Plugin(
 *   id = "ndx_aws_ai_toolbar",
 *   ckeditor5 = @CKEditor5AspectsOfCKEditor5Plugin(
 *     plugins = {"aiToolbar.AiToolbar"},
 *     config = {},
 *   ),
 *   drupal = @DrupalAspectsOfCKEditor5Plugin(
 *     label = @Translation("AI Toolbar"),
 *     library = "ndx_aws_ai/ckeditor5.aiToolbar",
 *     elements = false,
 *     toolbar_items = {
 *       "aiToolbar" = {
 *         "label" = @Translation("AI Assistant"),
 *       },
 *     },
 *   ),
 * )
 */
class AiToolbar extends CKEditor5PluginDefault {

}
