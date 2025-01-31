import React from 'react';
import PropTypes from 'prop-types';
import MailPoet from 'mailpoet';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

class ListingItem extends React.Component {
  state = {
    expanded: false,
  };

  handleSelectItem = (e) => {
    this.props.onSelectItem(
      parseInt(e.target.value, 10),
      e.target.checked
    );

    return !e.target.checked;
  };

  handleRestoreItem = (id) => {
    this.props.onRestoreItem(id);
  };

  handleTrashItem = (id) => {
    this.props.onTrashItem(id);
  };

  handleDeleteItem = (id) => {
    this.props.onDeleteItem(id);
  };

  handleToggleItem = () => {
    this.setState((prevState) => ({
      expanded: !prevState.expanded,
    }));
  };

  render() {
    let checkbox = false;

    if (this.props.is_selectable === true) {
      checkbox = (
        <th className="mailpoet-check-column" scope="row">
          <label className="screen-reader-text" htmlFor={`listing-row-checkbox-${this.props.item.id}`}>
            {
              `Select ${this.props.item[this.props.columns[0].name]}`
            }
          </label>
          <input
            type="checkbox"
            value={this.props.item.id}
            checked={
              this.props.item.selected || this.props.selection === 'all'
            }
            onChange={this.handleSelectItem}
            disabled={this.props.selection === 'all'}
            id={`listing-row-checkbox-${this.props.item.id}`}
          />
        </th>
      );
    }

    const customActions = this.props.item_actions;
    let itemActions = false;

    if (customActions.length > 0) {
      let isFirst = true;
      itemActions = customActions
        .filter((action) => action.display === undefined || action.display(this.props.item))
        .map((action, index) => {
          let customAction = null;

          if (action.name === 'trash') {
            customAction = (
              <span key={`action-${action.name}`} className="trash">
                {(!isFirst) ? ' | ' : ''}
                <a
                  type="button"
                  href="javascript:;"
                  onClick={() => this.handleTrashItem(this.props.item.id)}
                >
                  {MailPoet.I18n.t('moveToTrash')}
                </a>
              </span>
            );
          } else if (action.refresh) {
            customAction = (
              <span
                onClick={this.props.onRefreshItems}
                key={`action-${action.name}`}
                className={action.name}
                role="button"
                tabIndex={index}
                onKeyDown={(event) => {
                  if ((['keydown', 'keypress'].includes(event.type) && ['Enter', ' '].includes(event.key))
                  ) {
                    event.preventDefault();
                    this.props.onRefreshItems();
                  }
                }}
              >
                {(!isFirst) ? ' | ' : ''}
                { action.link(this.props.item) }
              </span>
            );
          } else if (action.link) {
            customAction = (
              <span
                key={`action-${action.name}`}
                className={action.name}
              >
                {(!isFirst) ? ' | ' : ''}
                { action.link(this.props.item) }
              </span>
            );
          } else {
            customAction = (
              <span
                key={`action-${action.name}`}
                className={action.name}
              >
                {(!isFirst) ? ' | ' : ''}
                <a
                  href="javascript:;"
                  onClick={
                    (action.onClick !== undefined)
                      ? () => action.onClick(this.props.item, this.props.onRefreshItems)
                      : false
                  }
                >
                  { action.label }
                </a>
              </span>
            );
          }

          if (customAction !== null && isFirst === true) {
            isFirst = false;
          }

          return customAction;
        });
    } else {
      itemActions = (
        <span className="edit">
          <Link to={`/edit/${this.props.item.id}`}>{MailPoet.I18n.t('edit')}</Link>
        </span>
      );
    }

    let actions;

    if (this.props.group === 'trash') {
      actions = (
        <div>
          <div className="row-actions">
            <span>
              <a
                href="javascript:;"
                onClick={() => this.handleRestoreItem(this.props.item.id)}
              >
                {MailPoet.I18n.t('restore')}
              </a>
            </span>
            { ' | ' }
            <span className="delete">
              <a
                className="submitdelete"
                href="javascript:;"
                onClick={() => this.handleDeleteItem(this.props.item.id)}
              >
                {MailPoet.I18n.t('deletePermanently')}
              </a>
            </span>
          </div>
          <button
            onClick={() => this.handleToggleItem(this.props.item.id)}
            className="toggle-row"
            type="button"
          >
            <span className="screen-reader-text">{MailPoet.I18n.t('showMoreDetails')}</span>
          </button>
        </div>
      );
    } else {
      actions = (
        <div>
          <div className="row-actions">
            { itemActions }
          </div>
          <button
            onClick={() => this.handleToggleItem(this.props.item.id)}
            className="toggle-row"
            type="button"
          >
            <span className="screen-reader-text">{MailPoet.I18n.t('showMoreDetails')}</span>
          </button>
        </div>
      );
    }

    const rowClasses = classNames({ 'is-expanded': this.state.expanded });

    return (
      <tr className={rowClasses} data-automation-id={`listing_item_${this.props.item.id}`}>
        { checkbox }
        { this.props.onRenderItem(this.props.item, actions) }
      </tr>
    );
  }
}

ListingItem.propTypes = {
  onSelectItem: PropTypes.func.isRequired,
  onRestoreItem: PropTypes.func.isRequired,
  onTrashItem: PropTypes.func.isRequired,
  onDeleteItem: PropTypes.func.isRequired,
  is_selectable: PropTypes.bool.isRequired,
  item: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  selection: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
  ]).isRequired,
  item_actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  onRefreshItems: PropTypes.func.isRequired,
  onRenderItem: PropTypes.func.isRequired,
  group: PropTypes.string.isRequired,
};

export default ListingItem;
