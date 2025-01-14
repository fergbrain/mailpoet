<?php

namespace MailPoet\Test\Doctrine\Types;

/**
 * @Entity()
 * @Table(name="test_json_entity")
 */
class JsonEntity {
  /**
   * @Column(type="integer")
   * @Id
   * @GeneratedValue
   * @var int|null
   */
  private $id;

  /**
   * @Column(type="json")
   * @var array|null
   */
  private $json_data;

  /**
   * @Column(type="json_or_serialized")
   * @var array|null
   */
  private $json_or_serialized_data;

  /**
   * @return int|null
   */
  function getId() {
    return $this->id;
  }

  /**
   * @return array|null
   */
  public function getJsonData() {
    return $this->json_data;
  }

  /**
   * @param array|null $json_data
   */
  public function setJsonData($json_data) {
    $this->json_data = $json_data;
  }

  /**
   * @return array|null
   */
  public function getJsonOrSerializedData() {
    return $this->json_or_serialized_data;
  }

  /**
   * @param array|null $json_or_serialized_data
   */
  public function setJsonOrSerializedData($json_or_serialized_data) {
    $this->json_or_serialized_data = $json_or_serialized_data;
  }
}
