<?php

namespace MailPoet\Entities;

use MailPoet\Doctrine\EntityTraits\AutoincrementedIdTrait;
use MailPoet\Doctrine\EntityTraits\CreatedAtTrait;
use MailPoet\Doctrine\EntityTraits\UpdatedAtTrait;

/**
 * @Entity()
 * @Table(name="feature_flags")
 */
class FeatureFlagEntity {
  use AutoincrementedIdTrait;
  use CreatedAtTrait;
  use UpdatedAtTrait;

  /**
   * @Column(type="string", nullable=false, unique=true)
   * @var string
   */
  private $name;

  /**
   * @Column(type="smallint", options={"unsigned":true}, nullable=true)
   * @var integer|null
   */
  private $value;

  /**
   * @param string $name
   * @param integer|null $value
   */
  public function __construct($name, $value = null) {
    $this->name = $name;
    $this->value = $value;
  }

  /** @return string */
  public function getName() {
    return $this->name;
  }

  /** @param string $name */
  public function setName($name) {
    $this->name = $name;
  }

  /** @return integer|null */
  public function getValue() {
    return $this->value;
  }

  /** @param integer|null $value */
  public function setValue($value) {
    $this->value = $value;
  }
}
