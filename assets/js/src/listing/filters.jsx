import React from 'react';
import jQuery from 'jquery';
import MailPoet from 'mailpoet';

class ListingFilters extends React.Component {
  handleFilterAction = () => {
    const filters = {};
    this.getAvailableFilters().forEach((filter, i) => {
      filters[this[`filter-${i}`].name] = this[`filter-${i}`].value;
    });
    if (this.props.onBeforeSelectFilter) {
      this.props.onBeforeSelectFilter(filters);
    }
    return this.props.onSelectFilter(filters);
  };

  handleEmptyTrash = () => {
    return this.props.onEmptyTrash();
  };

  getAvailableFilters = () => {
    const filters = this.props.filters;
    return Object.keys(filters).filter(filter => !(
      filters[filter].length === 0
        || (
          filters[filter].length === 1
          && !filters[filter][0].value
        )
    ));
  };

  componentDidUpdate() {
    const selectedFilters = this.props.filter;
    this.getAvailableFilters().forEach(
      (filter, i) => {
        if (selectedFilters[filter] !== undefined && selectedFilters[filter]) {
          jQuery(this[`filter-${i}`])
            .val(selectedFilters[filter])
            .trigger('change');
        }
      }
    );
  }

  render() {
    const filters = this.props.filters;
    const availableFilters = this.getAvailableFilters()
      .map((filter, i) => (
        <select
          ref={(c) => { this[`filter-${i}`] = c; }}
          key={`filter-${filter}`}
          name={filter}
        >
          { filters[filter].map(option => (
            <option
              value={option.value}
              key={`filter-option-${option.value}`}
            >{ option.label }</option>
          )) }
        </select>
      ));

    let button;

    if (availableFilters.length > 0) {
      button = (
        <input
          id="post-query-submit"
          onClick={this.handleFilterAction}
          type="submit"
          defaultValue={MailPoet.I18n.t('filter')}
          className="button"
        />
      );
    }

    let emptyTrash;
    if (this.props.group === 'trash') {
      emptyTrash = (
        <input
          onClick={this.handleEmptyTrash}
          type="submit"
          value={MailPoet.I18n.t('emptyTrash')}
          className="button"
        />
      );
    }

    return (
      <div className="alignleft actions actions">
        { availableFilters }
        { button }
        { emptyTrash }
      </div>
    );
  }
}

export default ListingFilters;
