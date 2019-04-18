<?php
namespace MailPoet\Test\Statistics\Track;

use DateTime;
use MailPoet\Models\Newsletter;
use MailPoet\Models\NewsletterLink;
use MailPoet\Models\SendingQueue;
use MailPoet\Models\StatisticsClicks;
use MailPoet\Models\StatisticsWooCommercePurchases;
use MailPoet\Models\Subscriber;
use MailPoet\Statistics\Track\WooCommercePurchases;
use MailPoet\Tasks\Sending;
use MailPoet\WooCommerce\Helper as WooCommerceHelper;
use PHPUnit_Framework_MockObject_MockObject;
use WC_Order;

class WooCommercePurchasesTest extends \MailPoetTest {
  /** @var Subscriber */
  private $subscriber;

  /** @var Subscriber */
  private $newsletter;

  /** @var Sending */
  private $queue;

  /** @var NewsletterLink */
  private $link;

  function _before() {
    parent::_before();

    $this->subscriber = $this->createSubscriber('test@example.com');
    $this->newsletter = $this->createNewsletter();
    $this->queue = $this->createQueue($this->newsletter, $this->subscriber);
    $this->link = $this->createLink($this->newsletter, $this->queue);
  }

  function testItTracksPayment() {
    $click = $this->createClick($this->link, $this->subscriber);
    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    $purchase_stats = StatisticsWooCommercePurchases::findMany();
    expect(count($purchase_stats))->equals(1);
    expect($purchase_stats[0]->newsletter_id)->equals($this->newsletter->id);
    expect($purchase_stats[0]->subscriber_id)->equals($this->subscriber->id);
    expect($purchase_stats[0]->queue_id)->equals($this->queue->id);
    expect($purchase_stats[0]->click_id)->equals($click->id);
    expect($purchase_stats[0]->order_id)->equals($order_mock->get_id());
    expect($purchase_stats[0]->order_currency)->equals($order_mock->get_currency());
    expect($purchase_stats[0]->order_price_total)->equals($order_mock->get_total());
  }

  function testItTracksPaymentForMultipleNewsletters() {
    $this->createClick($this->link, $this->subscriber);

    // create click in other newsletter
    $newsletter = $this->createNewsletter();
    $queue = $this->createQueue($newsletter, $this->subscriber);
    $link = $this->createLink($newsletter, $queue);
    $this->createClick($link, $this->subscriber, 1);

    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(2);
  }

  function testItTracksPaymentForMultipleOrders() {
    $this->createClick($this->link, $this->subscriber);

    // first order
    $order_mock = $this->createOrderMock($this->subscriber->email, 10.0, 123);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());

    // second order
    $order_mock = $this->createOrderMock($this->subscriber->email, 20.0, 456);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());

    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(2);
  }

  function testItTracksPaymentOnlyForLatestClick() {
    $latest_click = $this->createClick($this->link, $this->subscriber, 1);
    $this->createClick($this->link, $this->subscriber, 3);
    $this->createClick($this->link, $this->subscriber, 5);
    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());

    $purchase_stats = StatisticsWooCommercePurchases::findMany();
    expect(count($purchase_stats))->equals(1);
    expect($purchase_stats[0]->click_id)->equals($latest_click->id);
  }

  function testItTracksPaymentOnlyOnce() {
    $this->createClick($this->link, $this->subscriber);
    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(1);
  }

  function testItDoesNotTrackPaymentWhenClickTooOld() {
    $this->createClick($this->link, $this->subscriber, 20);
    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(0);
  }

  function testItDoesNotTrackPaymentForDifferentEmail() {
    $this->createClick($this->link, $this->subscriber);
    $order_mock = $this->createOrderMock('different.email@example.com');
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(0);
  }

  function testItDoesNotTrackPaymentWhenClickNewerThanOrder() {
    $this->createClick($this->link, $this->subscriber, 0);
    $order_mock = $this->createOrderMock($this->subscriber->email);
    $woocommerce_purchases = new WooCommercePurchases($this->createWooCommerceHelperMock($order_mock));
    $woocommerce_purchases->trackPurchase($order_mock->get_id());
    expect(count(StatisticsWooCommercePurchases::findMany()))->equals(0);
  }

  function _after() {
    \ORM::raw_execute('TRUNCATE ' . Newsletter::$_table);
    \ORM::raw_execute('TRUNCATE ' . Subscriber::$_table);
    \ORM::raw_execute('TRUNCATE ' . SendingQueue::$_table);
    \ORM::raw_execute('TRUNCATE ' . StatisticsClicks::$_table);
    \ORM::raw_execute('TRUNCATE ' . StatisticsWooCommercePurchases::$_table);
  }

  private function createNewsletter() {
    $newsletter = Newsletter::create();
    $newsletter->type = Newsletter::TYPE_STANDARD;
    return $newsletter->save();
  }

  private function createQueue(Newsletter $newsletter, Subscriber $subscriber) {
    $queue = Sending::create();
    $queue->newsletter_id = $newsletter->id;
    $queue->setSubscribers([$subscriber->id]);
    $queue->updateProcessedSubscribers([$subscriber->id]);
    return $queue->save();
  }

  private function createSubscriber($email) {
    $subscriber = Subscriber::create();
    $subscriber->email = $email;
    $subscriber->first_name = 'First';
    $subscriber->last_name = 'Last';
    return $subscriber->save();
  }

  private function createLink(Newsletter $newsletter, Sending $queue) {
    $link = NewsletterLink::create();
    $link->hash = 'hash';
    $link->url = 'url';
    $link->newsletter_id = $newsletter->id;
    $link->queue_id = $queue->id;
    return $link->save();
  }

  private function createClick(NewsletterLink $link, Subscriber $subscriber, $created_days_ago = 5) {
    $click = StatisticsClicks::create();
    $click->newsletter_id = $link->newsletter_id;
    $click->subscriber_id = $subscriber->id;
    $click->queue_id = $link->queue_id;
    $click->link_id = $link->id;
    $click->count = 1;

    $timestamp = new DateTime("-$created_days_ago days");
    $click->created_at = $timestamp->format('Y-m-d H:i:s');
    $click->updated_at = $timestamp->format('Y-m-d H:i:s');
    return $click->save();
  }

  private function createWooCommerceHelperMock(PHPUnit_Framework_MockObject_MockObject $order_mock) {
    $mock = $this->createMock(WooCommerceHelper::class);
    $mock->method('wcGetOrder')->willReturn($order_mock);
    return $mock;
  }

  private function createOrderMock($email, $total_price = 15.0, $id = 123) {
    // WC_Order class needs to be mocked without default 'disallowMockingUnknownTypes'
    // since WooCommerce may not be active (would result in error mocking undefined class)
    $mock = $this->getMockBuilder(WC_Order::class)
      ->disableOriginalConstructor()
      ->disableOriginalClone()
      ->disableArgumentCloning()
      ->setMethods(['get_id', 'get_date_created', 'get_billing_email', 'get_total', 'get_currency'])
      ->getMock();

    $mock->method('get_id')->willReturn($id);
    $mock->method('get_date_created')->willReturn(new DateTime());
    $mock->method('get_billing_email')->willReturn($email);
    $mock->method('get_total')->willReturn((string)$total_price);
    $mock->method('get_currency')->willReturn('EUR');
    return $mock;
  }
}