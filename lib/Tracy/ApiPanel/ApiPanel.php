<?php

namespace MailPoet\Tracy\ApiPanel;

use MailPoet\API\JSON\Endpoint as APIEndpoint;
use ReflectionClass;
use Tracy\Debugger;
use Tracy\IBarPanel;

/**
 * Inspired by: https://componette.com/macfja/tracy-doctrine-sql/
 */
class ApiPanel implements IBarPanel {
  /** @var APIEndpoint */
  protected $endpoint;

  /** @var string */
  protected $request_method;

  /** @var array */
  protected $request_data;

  /** @var ReflectionClass */
  protected $endpoint_reflection;

  function __construct($endpoint, $request_method, $request_data) {
    $this->endpoint = $endpoint;
    $this->request_method = $request_method;
    $this->request_data = $request_data;
    $this->endpoint_reflection = new ReflectionClass($endpoint);
  }

  function getTab() {
    $img = '<svg height="128px" id="Layer_1" style="enable-background:new 0 0 128 128;" version="1.1" viewBox="0 0 128 128" width="128px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g><g><g><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-linecap:square;stroke-miterlimit:10;" x1="63.185" x2="37.821" y1="84.061" y2="109.423"/><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-linecap:square;stroke-miterlimit:10;" x1="37.821" x2="12.456" y1="109.423" y2="84.061"/></g><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-miterlimit:10;" x1="37.821" x2="37.821" y1="109.423" y2="9.801"/></g><g><g><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-linecap:square;stroke-miterlimit:10;" x1="64.815" x2="90.181" y1="44.241" y2="18.877"/><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-linecap:square;stroke-miterlimit:10;" x1="90.181" x2="115.544" y1="18.877" y2="44.241"/></g><line style="fill:none;stroke:#2F3435;stroke-width:12;stroke-miterlimit:10;" x1="90.181" x2="90.181" y1="18.877" y2="118.199"/></g></g></svg>';
    return $img . '<span class="tracy-label" >' . $this->getEndpointName() . '</span>';
  }

  function getPanel() {
    ob_start();
    require __DIR__ . '/api-panel.phtml';
    return ob_get_clean();
  }

  static function init($endpoint, $request_method, $request_data) {
    Debugger::getBar()->addPanel(new static($endpoint, $request_method, $request_data));
  }

  private function getEndpointName() {
    return $this->endpoint_reflection->getShortName() . '::' . $this->request_method . '()';
  }
}
