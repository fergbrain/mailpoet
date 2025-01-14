<?php
namespace MailPoet\Test\Config;

use Codeception\Stub;
use Codeception\Stub\Expected;
use MailPoet\Config\Env;
use MailPoet\Config\Installer;

class InstallerTest extends \MailPoetTest {
  function _before() {
    parent::_before();
    $this->slug = 'some-plugin';

    $this->installer = new Installer(
      $this->slug
    );
  }

  function testItInitializes() {
    $installer = Stub::make(
      $this->installer,
      [
        'getPluginInformation' => Expected::once(),
      ],
      $this
    );
    $installer->init();
    apply_filters('plugins_api', null, null, null);
  }

  function testItGetsPluginInformation() {
    $args = new \StdClass;
    $args->slug = $this->slug;
    $installer = Stub::construct(
      $this->installer,
      [
        $this->slug,
      ],
      [
        'retrievePluginInformation' => function () {
          $obj = new \stdClass();
          $obj->slug = $this->slug;
          $obj->plugin_name = 'MailPoet Premium';
          $obj->new_version = '3.0.0-alpha.0.0.3.1';
          $obj->requires = '4.6';
          $obj->tested = '4.7.4';
          $obj->downloaded = 12540;
          $obj->last_updated = date('Y-m-d');
          $obj->sections = [
            'description' => 'The new version of the Premium plugin',
            'another_section' => 'This is another section',
            'changelog' => 'Some new features',
          ];
          $obj->download_link = home_url() . '/wp-content/uploads/mailpoet-premium.zip';
          $obj->package = $obj->download_link;
          return $obj;
        },
      ],
      $this
    );
    $result = $installer->getPluginInformation(false, 'plugin_information', $args);
    expect($result->slug)->equals($this->slug);
    expect($result->new_version)->notEmpty();
    expect($result->download_link)->notEmpty();
    expect($result->package)->notEmpty();
  }

  function testItIgnoresNonMatchingRequestsWhenGettingPluginInformation() {
    $data = new \StdClass;
    $data->some_property = '123';
    $result = $this->installer->getPluginInformation($data, 'some_action', null);
    expect($result)->equals($data);
    $args = new \StdClass;
    $args->slug = 'different-slug';
    $result = $this->installer->getPluginInformation($data, 'plugin_information', $args);
    expect($result)->equals($data);
  }

  function testItGetsPremiumStatus() {
    $status = Installer::getPremiumStatus();
    expect(isset($status['premium_plugin_active']))->true();
    expect(isset($status['premium_plugin_installed']))->true();
    expect(isset($status['premium_install_url']))->true();
    expect(isset($status['premium_activate_url']))->true();
  }

  function testItChecksIfAPluginIsInstalled() {
    expect(Installer::isPluginInstalled(Env::$plugin_name))->true();
    expect(Installer::isPluginInstalled('some-non-existent-plugin-123'))->false();
  }

  function testItGetsPluginInstallUrl() {
    expect(Installer::getPluginInstallationUrl(Env::$plugin_name))
      ->startsWith(home_url() . '/wp-admin/update.php?action=install-plugin&plugin=mailpoet&_wpnonce=');
  }

  function testItGetsPluginActivateUrl() {
    expect(Installer::getPluginActivationUrl(Env::$plugin_name))
      ->startsWith(home_url() . '/wp-admin/plugins.php?action=activate&plugin=mailpoet/mailpoet.php&_wpnonce=');
  }
}
