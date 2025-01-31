<?php
namespace MailPoet\Test\Cron\Workers;

use Carbon\Carbon;
use MailPoet\Cron\Workers\WooCommerceSync;
use MailPoet\Models\ScheduledTask;
use MailPoet\Segments\WooCommerce as WooCommerceSegment;
use MailPoet\WooCommerce\Helper as WooCommerceHelper;

class WooCommerceSyncTest extends \MailPoetTest {
  function _before() {
    $this->woocommerce_segment = $this->createMock(WooCommerceSegment::class);
    $this->woocommerce_helper = $this->createMock(WooCommerceHelper::class);
    $this->worker = new WooCommerceSync($this->woocommerce_segment, $this->woocommerce_helper, microtime(true));
  }

  function testItWillNotRunIfWooCommerceIsDisabled() {
    $this->woocommerce_helper->method('isWooCommerceActive')
      ->willReturn(false);
    expect($this->worker->checkProcessingRequirements())->false();
  }

  function testItWillRunIfWooCommerceIsEnabled() {
    $this->woocommerce_helper->method('isWooCommerceActive')
      ->willReturn(true);
    expect($this->worker->checkProcessingRequirements())->true();
  }

  function testItCallsWooCommerceSync() {
    $this->woocommerce_segment->expects($this->once())
      ->method('synchronizeCustomers');
    $task = $this->createScheduledTask();
    expect($this->worker->processTaskStrategy($task))->equals(true);
  }

  function testItWillNotRunInMultipleInstances() {
    $this->woocommerce_segment->expects($this->once())
      ->method('synchronizeCustomers');
    $task = $this->createScheduledTask();
    expect($this->worker->processTaskStrategy($task))->equals(true);
    expect($this->worker->processTaskStrategy($task))->equals(false);
    expect($task->getMeta())->notEmpty();
  }

  function testItWillResetTheInProgressFlagOnFail() {
    $task = $this->createScheduledTask();
    $this->woocommerce_segment->expects($this->once())
      ->method('synchronizeCustomers')
      ->willThrowException(new \Exception('test error'));
    try {
      $this->worker->processTaskStrategy($task);
      $this->fail('An exception should be thrown');
    } catch (\Exception $e) {
      expect($e->getMessage())->equals('test error');
      expect($task->getMeta())->isEmpty();
    }
  }

  function testItWillRescheduleTaskIfItIsRunningForTooLong() {
    $this->woocommerce_segment->expects($this->once())
      ->method('synchronizeCustomers');
    $task = $this->createScheduledTask();
    $task = ScheduledTask::findOne($task->id); // make sure `updated_at` is set by the DB
    expect($this->worker->processTaskStrategy($task))->equals(true);
    $scheduled_at = $task->scheduled_at;
    $task->updated_at = Carbon::createFromTimestamp(strtotime($task->updated_at))
      ->subMinutes(WooCommerceSync::TASK_RUN_TIMEOUT + 1);
    expect($this->worker->processTaskStrategy($task))->equals(false);
    expect($scheduled_at < $task->scheduled_at)->true();
    expect($task->status)->equals(ScheduledTask::STATUS_SCHEDULED);
    expect($task->getMeta())->isEmpty();
  }

  private function createScheduledTask() {
    $task = ScheduledTask::create();
    $task->type = WooCommerceSync::TASK_TYPE;
    $task->status = null;
    $task->scheduled_at = Carbon::createFromTimestamp(current_time('timestamp'));
    $task->save();
    return $task;
  }

  function _after() {
    \ORM::raw_execute('TRUNCATE ' . ScheduledTask::$_table);
  }
}