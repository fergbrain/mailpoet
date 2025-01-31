<?php
namespace MailPoet\Newsletter\Renderer\Blocks;

class ImageTest extends \MailPoetUnitTest {

  private $block = [
    'type' => 'image',
    'link' => 'http://example.com',
    'src' => 'http://mailpoet.localhost/image.jpg',
    'alt' => 'Alt text',
    'fullWidth' => false,
    'width' => '310.015625px',
    'height' => '390px',
    'styles' => [
      'block' => [
        'textAlign' => 'center',
      ],
    ],
  ];

  function testItRendersCorrectly() {
    $output = Image::render($this->block, 200);
    $expected_result = '
      <tr>
        <td class="mailpoet_image mailpoet_padded_vertical mailpoet_padded_side" align="center" valign="top">
          <a href="http://example.com"><img src="http://mailpoet.localhost/image.jpg" width="160" alt="Alt text"/></a>
        </td>
      </tr>';
    expect($output)->equals($expected_result);
  }

  function testItRendersWithoutLink() {
    $this->block['link'] = null;
    $output = Image::render($this->block, 200);
    $expected_result = '
      <tr>
        <td class="mailpoet_image mailpoet_padded_vertical mailpoet_padded_side" align="center" valign="top">
          <img src="http://mailpoet.localhost/image.jpg" width="160" alt="Alt text"/>
        </td>
      </tr>';
    expect($output)->equals($expected_result);
  }
}
