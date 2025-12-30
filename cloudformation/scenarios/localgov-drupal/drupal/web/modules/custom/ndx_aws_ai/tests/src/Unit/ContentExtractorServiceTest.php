<?php

declare(strict_types=1);

namespace Drupal\Tests\ndx_aws_ai\Unit;

use Drupal\ndx_aws_ai\Service\ContentExtractorService;
use Drupal\node\NodeInterface;
use Drupal\Core\Field\FieldItemListInterface;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;
use Psr\Log\LoggerInterface;

/**
 * Unit tests for ContentExtractorService.
 *
 * @coversDefaultClass \Drupal\ndx_aws_ai\Service\ContentExtractorService
 * @group ndx_aws_ai
 *
 * Story 4.6: Listen to Page (TTS Button)
 */
class ContentExtractorServiceTest extends TestCase {

  use ProphecyTrait;

  /**
   * The mocked logger.
   *
   * @var \Psr\Log\LoggerInterface|\Prophecy\Prophecy\ObjectProphecy
   */
  protected $logger;

  /**
   * The service under test.
   *
   * @var \Drupal\ndx_aws_ai\Service\ContentExtractorService
   */
  protected ContentExtractorService $service;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->logger = $this->prophesize(LoggerInterface::class);
    $this->logger->debug(Argument::any(), Argument::any())->willReturn(NULL);
    $this->logger->info(Argument::any(), Argument::any())->willReturn(NULL);

    $this->service = new ContentExtractorService(
      $this->logger->reveal(),
    );
  }

  /**
   * Test cleanForTts strips HTML tags.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsStripsHtml(): void {
    $html = '<p>Hello <strong>world</strong></p>';
    $result = $this->service->cleanForTts($html);

    $this->assertStringNotContainsString('<p>', $result);
    $this->assertStringNotContainsString('<strong>', $result);
    $this->assertStringContainsString('Hello', $result);
    $this->assertStringContainsString('world', $result);
  }

  /**
   * Test cleanForTts removes script tags.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsRemovesScripts(): void {
    $html = '<p>Content</p><script>alert("evil")</script><p>More content</p>';
    $result = $this->service->cleanForTts($html);

    $this->assertStringNotContainsString('alert', $result);
    $this->assertStringNotContainsString('script', $result);
    $this->assertStringContainsString('Content', $result);
    $this->assertStringContainsString('More content', $result);
  }

  /**
   * Test cleanForTts removes style tags.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsRemovesStyles(): void {
    $html = '<style>.foo { color: red; }</style><p>Content</p>';
    $result = $this->service->cleanForTts($html);

    $this->assertStringNotContainsString('color', $result);
    $this->assertStringNotContainsString('.foo', $result);
    $this->assertStringContainsString('Content', $result);
  }

  /**
   * Test cleanForTts normalizes whitespace.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsNormalizesWhitespace(): void {
    $html = '<p>Line one</p>   <p>Line two</p>     <p>Line three</p>';
    $result = $this->service->cleanForTts($html);

    // Should not have excessive spaces.
    $this->assertStringNotContainsString('  ', $result);
  }

  /**
   * Test cleanForTts decodes HTML entities.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsDecodesEntities(): void {
    $html = '<p>Council&apos;s &amp; Borough&rsquo;s services</p>';
    $result = $this->service->cleanForTts($html);

    $this->assertStringContainsString("Council's", $result);
    $this->assertStringContainsString('&', $result);
  }

  /**
   * Test cleanForTts handles empty input.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsHandlesEmptyInput(): void {
    $result = $this->service->cleanForTts('');
    $this->assertEquals('', $result);
  }

  /**
   * Test cleanForTts preserves list structure.
   *
   * @covers ::cleanForTts
   */
  public function testCleanForTtsPreservesLists(): void {
    $html = '<ul><li>First item</li><li>Second item</li></ul>';
    $result = $this->service->cleanForTts($html);

    $this->assertStringContainsString('First item', $result);
    $this->assertStringContainsString('Second item', $result);
    // List items should be on separate lines or marked.
    $this->assertStringContainsString('-', $result);
  }

  /**
   * Test extractFromNode with body field.
   *
   * @covers ::extractFromNode
   */
  public function testExtractFromNodeWithBody(): void {
    $node = $this->prophesize(NodeInterface::class);
    $node->id()->willReturn('1');
    $node->getTitle()->willReturn('Test Page Title');

    $bodyField = $this->prophesize(FieldItemListInterface::class);
    $bodyField->isEmpty()->willReturn(FALSE);
    $bodyField->__get('value')->willReturn('<p>This is the page body content.</p>');

    $node->hasField('body')->willReturn(TRUE);
    $node->get('body')->willReturn($bodyField->reveal());
    $node->hasField('field_summary')->willReturn(FALSE);
    $node->hasField('field_description')->willReturn(FALSE);
    $node->hasField('field_content')->willReturn(FALSE);

    $result = $this->service->extractFromNode($node->reveal());

    $this->assertStringContainsString('Test Page Title', $result);
    $this->assertStringContainsString('This is the page body content', $result);
  }

  /**
   * Test extractFromNode with empty body.
   *
   * @covers ::extractFromNode
   */
  public function testExtractFromNodeWithEmptyBody(): void {
    $node = $this->prophesize(NodeInterface::class);
    $node->id()->willReturn('1');
    $node->getTitle()->willReturn('Title Only');

    $bodyField = $this->prophesize(FieldItemListInterface::class);
    $bodyField->isEmpty()->willReturn(TRUE);

    $node->hasField('body')->willReturn(TRUE);
    $node->get('body')->willReturn($bodyField->reveal());
    $node->hasField('field_summary')->willReturn(FALSE);
    $node->hasField('field_description')->willReturn(FALSE);
    $node->hasField('field_content')->willReturn(FALSE);

    $result = $this->service->extractFromNode($node->reveal());

    $this->assertStringContainsString('Title Only', $result);
  }

  /**
   * Test extractFromHtml with article content.
   *
   * @covers ::extractFromHtml
   */
  public function testExtractFromHtmlWithArticle(): void {
    $html = '
      <html>
        <body>
          <nav>Navigation</nav>
          <article class="node">
            <h1>Page Title</h1>
            <p>Main content here.</p>
          </article>
          <aside>Sidebar content</aside>
        </body>
      </html>
    ';

    $result = $this->service->extractFromHtml($html, 'article.node');

    $this->assertStringContainsString('Page Title', $result);
    $this->assertStringContainsString('Main content', $result);
    $this->assertStringNotContainsString('Navigation', $result);
    $this->assertStringNotContainsString('Sidebar', $result);
  }

  /**
   * Test extractFromHtml removes navigation elements.
   *
   * @covers ::extractFromHtml
   */
  public function testExtractFromHtmlRemovesNav(): void {
    $html = '
      <html>
        <body>
          <main>
            <nav>Skip to content</nav>
            <article>
              <p>Article content</p>
            </article>
          </main>
        </body>
      </html>
    ';

    $result = $this->service->extractFromHtml($html);

    $this->assertStringContainsString('Article content', $result);
    $this->assertStringNotContainsString('Skip to content', $result);
  }

  /**
   * Test extractFromHtml with empty HTML.
   *
   * @covers ::extractFromHtml
   */
  public function testExtractFromHtmlWithEmptyHtml(): void {
    $result = $this->service->extractFromHtml('');
    $this->assertEquals('', $result);
  }

  /**
   * Test extractFromHtml fallback to body.
   *
   * @covers ::extractFromHtml
   */
  public function testExtractFromHtmlFallsBackToBody(): void {
    $html = '
      <html>
        <body>
          <p>Body content only</p>
        </body>
      </html>
    ';

    // Using a selector that won't match.
    $result = $this->service->extractFromHtml($html, '.nonexistent');

    $this->assertStringContainsString('Body content only', $result);
  }

}
