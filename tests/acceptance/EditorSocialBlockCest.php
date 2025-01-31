<?php

namespace MailPoet\Test\Acceptance;

use MailPoet\Test\DataFactories\Newsletter;

class EditorSocialBlockCest {
  function addSocialBlock(\AcceptanceTester $I) {
    $I->wantTo('add social block to newsletter');
    $socialBlockInEditor = ('[data-automation-id="socialBlock"]');
    $socialBlockSettingsAssertion = ('[data-automation-id="social_select_another_network"]');
    $newsletter = (new Newsletter())
      ->loadBodyFrom('newsletterWithText.json')
      ->create();
    $I->login();
    $I->amEditingNewsletter($newsletter->id);
    $I->dragAndDrop('#automation_editor_block_social', '#mce_1');
    //Open settings by clicking on block
    $I->moveMouseOver($socialBlockInEditor, 3, 2);
    $I->click($socialBlockInEditor);
    $I->waitForElementVisible($socialBlockSettingsAssertion);
    $I->click('Done');
  }

}
