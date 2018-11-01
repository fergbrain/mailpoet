import jQuery from 'jquery';
import React from 'react';
import createReactClass from 'create-react-class';
import _ from 'underscore';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import MailPoet from 'mailpoet';
import ListingBulkActions from 'listing/bulk_actions.jsx';
import ListingHeader from 'listing/header.jsx';
import ListingPages from 'listing/pages.jsx';
import ListingSearch from 'listing/search.jsx';
import ListingGroups from 'listing/groups.jsx';
import ListingFilters from 'listing/filters.jsx';
import ListingItems from 'listing/listing_items.jsx';

const Listing = createReactClass({ // eslint-disable-line react/prefer-es6-class
  displayName: 'Listing',

  /* eslint-disable react/require-default-props */
  propTypes: {
    limit: PropTypes.number,
    sort_by: PropTypes.string,
    sort_order: PropTypes.string,
    params: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    auto_refresh: PropTypes.bool,
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }),
    base_url: PropTypes.string,
    type: PropTypes.string,
    endpoint: PropTypes.string.isRequired,
    afterGetItems: PropTypes.func,
    messages: PropTypes.shape({
      onRestore: PropTypes.func,
      onTrash: PropTypes.func,
      onDelete: PropTypes.func,
    }),
    onRenderItem: PropTypes.func.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object),
    bulk_actions: PropTypes.arrayOf(PropTypes.object),
    item_actions: PropTypes.arrayOf(PropTypes.object),
    search: PropTypes.bool,
    groups: PropTypes.bool,
    renderExtraActions: PropTypes.func,
    onBeforeSelectFilter: PropTypes.func,
    getListingItemKey: PropTypes.func,
  },
  /* eslint-enable react/require-default-props */

  contextTypes: {
    router: PropTypes.object.isRequired,
  },

  getDefaultProps: () => ({
    limit: 10,
    sort_by: null,
    sort_order: undefined,
    auto_refresh: true,
    location: undefined,
    base_url: '',
    type: undefined,
    afterGetItems: undefined,
    messages: undefined,
    columns: [],
    bulk_actions: [],
    item_actions: [],
    search: true,
    groups: true,
    renderExtraActions: undefined,
    onBeforeSelectFilter: undefined,
    getListingItemKey: undefined,
  }),

  getInitialState: function getInitialState() {
    return {
      loading: false,
      search: '',
      page: 1,
      count: 0,
      limit: 10,
      sort_by: null,
      sort_order: null,
      items: [],
      groups: [],
      group: 'all',
      filters: {},
      filter: {},
      selected_ids: [],
      selection: false,
      meta: {},
    };
  },

  componentDidMount: function componentDidMount() {
    this.isComponentMounted = true;
    const params = this.props.params || {};
    this.initWithParams(params);

    if (this.props.auto_refresh) {
      jQuery(document).on('heartbeat-tick.mailpoet', () => {
        this.getItems();
      });
    }
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    const params = nextProps.params || {};
    this.initWithParams(params);
  },

  componentWillUnmount: function componentWillUnmount() {
    this.isComponentMounted = false;
  },

  setParams: function setParams() {
    if (this.props.location) {
      const params = Object.keys(this.state)
        .filter(key => (
          [
            'group',
            'filter',
            'search',
            'page',
            'sort_by',
            'sort_order',
          ].indexOf(key) !== -1
        ))
        .map((key) => {
          let value = this.state[key];
          if (value === Object(value)) {
            value = jQuery.param(value);
          } else if (value === Boolean(value)) {
            value = value.toString();
          }
          return {
            key,
            value,
          };
        })
        .filter(({ value }) => value !== '' && value !== null)
        .map(({ key, value }) => `${key}[${value}]`)
        .join('/');

      // set url
      const url = this.getUrlWithParams(params);

      if (this.props.location.pathname !== url) {
        this.context.router.push(`${url}`);
      }
    }
  },

  getUrlWithParams: function getUrlWithParams(params) {
    let baseUrl = (this.props.base_url !== undefined)
      ? this.props.base_url
      : null;

    if (baseUrl !== null) {
      baseUrl = this.setBaseUrlParams(baseUrl);
      return `/${baseUrl}/${params}`;
    }
    return `/${params}`;
  },

  setBaseUrlParams: function setBaseUrlParams(baseUrl) {
    let ret = baseUrl;
    if (ret.indexOf(':') !== -1) {
      const params = this.getParams();
      Object.keys(params).forEach((key) => {
        if (ret.indexOf(`:${key}`) !== -1) {
          ret = ret.replace(`:${key}`, params[key]);
        }
      });
    }

    return ret;
  },

  getParams: function getParams() {
    // get all route parameters (without the "splat")
    const params = _.omit(this.props.params, 'splat');
    // TODO:
    // find a way to set the "type" in the routes definition
    // so that it appears in `this.props.params`
    if (this.props.type) {
      params.type = this.props.type;
    }
    return params;
  },

  getParam: function getParam(param) {
    const regex = /(.*)\[(.*)\]/;
    const matches = regex.exec(param);
    return [matches[1], matches[2]];
  },

  getItems: function getItems() {
    if (!this.isComponentMounted) return;

    this.setState({ loading: true });
    this.clearSelection();

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'listing',
      data: {
        params: this.getParams(),
        offset: (this.state.page - 1) * this.state.limit,
        limit: this.state.limit,
        group: this.state.group,
        filter: this.state.filter,
        search: this.state.search,
        sort_by: this.state.sort_by,
        sort_order: this.state.sort_order,
      },
    }).always(() => {
      if (!this.isComponentMounted) return;
      this.setState({ loading: false });
    }).done((response) => {
      if (!this.isComponentMounted) return;
      this.setState({
        items: response.data || [],
        filters: response.meta.filters || {},
        groups: response.meta.groups || [],
        count: response.meta.count || 0,
        meta: _.omit(response.meta, ['filters', 'groups', 'count']),
      }, () => {
        // if viewing an empty trash
        if (this.state.group === 'trash' && response.meta.count === 0) {
          // redirect to default group
          this.handleGroup('all');
        }

        // trigger afterGetItems callback if specified
        if (this.props.afterGetItems !== undefined) {
          this.props.afterGetItems(this.state);
        }
      });
    }).fail((response) => {
      if (response.errors.length > 0) {
        MailPoet.Notice.error(
          response.errors.map(error => error.message),
          { scroll: true }
        );
      }
    });
  },

  initWithParams: function initWithParams(params) {
    const state = this.getInitialState();
    // check for url params
    if (params.splat) {
      params.splat.split('/').forEach((param) => {
        const [key, value] = this.getParam(param);
        const filters = {};
        switch (key) {
          case 'filter':
            value.split('&').forEach((pair) => {
              const [k, v] = pair.split('=');
              filters[k] = v;
            });

            state.filter = filters;
            break;
          default:
            state[key] = value;
        }
      });
    }

    // limit per page
    if (this.props.limit !== undefined) {
      state.limit = Math.abs(Number(this.props.limit));
    }

    // sort by
    if (state.sort_by === null && this.props.sort_by !== undefined) {
      state.sort_by = this.props.sort_by;
    }

    // sort order
    if (state.sort_order === null && this.props.sort_order !== undefined) {
      state.sort_order = this.props.sort_order;
    }

    this.setState(state, () => {
      this.getItems();
    });
  },

  handleRestoreItem: function handleRestoreItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'restore',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onRestore !== undefined
      ) {
        this.props.messages.onRestore(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleTrashItem: function handleTrashItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'trash',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onTrash !== undefined
      ) {
        this.props.messages.onTrash(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleDeleteItem: function handleDeleteItem(id) {
    this.setState({
      loading: true,
      page: 1,
    });

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'delete',
      data: {
        id,
      },
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onDelete !== undefined
      ) {
        this.props.messages.onDelete(response);
      }
      this.getItems();
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleEmptyTrash: function handleEmptyTrash() {
    return this.handleBulkAction('all', {
      action: 'delete',
      group: 'trash',
    }).done((response) => {
      if (
        this.props.messages !== undefined
        && this.props.messages.onDelete !== undefined
      ) {
        this.props.messages.onDelete(response);
      }
      // redirect to default group
      this.handleGroup('all');
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map(error => error.message),
        { scroll: true }
      );
    });
  },

  handleBulkAction: function handleBulkAction(selectedIds, params) {
    if (
      this.state.selection === false
      && this.state.selected_ids.length === 0
      && selectedIds !== 'all'
    ) {
      return false;
    }

    this.setState({ loading: true });

    const data = params || {};
    data.listing = {
      params: this.getParams(),
      offset: 0,
      limit: 0,
      filter: this.state.filter,
      group: this.state.group,
      search: this.state.search,
    };
    if (selectedIds !== 'all') {
      data.listing.selection = selectedIds;
    }

    return MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: this.props.endpoint,
      action: 'bulkAction',
      data,
    }).done(() => {
      this.getItems();
    }).fail((response) => {
      if (response.errors.length > 0) {
        MailPoet.Notice.error(
          response.errors.map(error => error.message),
          { scroll: true }
        );
      }
    });
  },

  handleSearch: function handleSearch(search) {
    this.setState({
      search,
      page: 1,
      selection: false,
      selected_ids: [],
    }, () => {
      this.setParams();
    });
  },

  handleSort: function handleSort(sortBy, sortOrder = 'asc') {
    this.setState({
      sort_by: sortBy,
      sort_order: (sortOrder === 'asc') ? 'asc' : 'desc',
    }, () => {
      this.setParams();
    });
  },

  handleSelectItem: function handleSelectItem(id, isChecked) {
    let selectedIds = this.state.selected_ids;
    let selection = false;

    if (isChecked) {
      selectedIds = jQuery.merge(selectedIds, [id]);
      // check whether all items on the page are selected
      if (
        jQuery('tbody .check-column :checkbox:not(:checked)').length === 0
      ) {
        selection = 'page';
      }
    } else {
      selectedIds.splice(selectedIds.indexOf(id), 1);
    }

    this.setState({
      selection,
      selected_ids: selectedIds,
    });
  },

  handleSelectItems: function handleSelectItems(isChecked) {
    if (isChecked === false) {
      this.clearSelection();
    } else {
      const selectedIds = this.state.items.map(item => Number(item.id));

      this.setState({
        selected_ids: selectedIds,
        selection: 'page',
      });
    }
  },

  handleSelectAll: function handleSelectAll() {
    if (this.state.selection === 'all') {
      this.clearSelection();
    } else {
      this.setState({
        selection: 'all',
        selected_ids: [],
      });
    }
  },

  clearSelection: function clearSelection() {
    this.setState({
      selection: false,
      selected_ids: [],
    });
  },

  handleFilter: function handleFilter(filters) {
    this.setState({
      filter: filters,
      page: 1,
    }, () => {
      this.setParams();
    });
  },

  handleGroup: function handleGroup(group) {
    // reset search
    jQuery('#search_input').val('');

    this.setState({
      group,
      filter: {},
      search: '',
      page: 1,
    }, () => {
      this.setParams();
    });
  },

  handleSetPage: function handleSetPage(page) {
    this.setState({
      page,
      selection: false,
      selected_ids: [],
    }, () => {
      this.setParams();
    });
  },

  handleRenderItem: function handleRenderItem(item, actions) {
    const render = this.props.onRenderItem(item, actions, this.state.meta);
    return render.props.children;
  },

  handleRefreshItems: function handleRefreshItems() {
    this.getItems();
  },

  render: function render() {
    const items = this.state.items;
    const sortBy = this.state.sort_by;
    const sortOrder = this.state.sort_order;

    // columns
    let columns = this.props.columns || [];
    columns = columns.filter(
      column => (column.display === undefined || !!(column.display) === true)
    );

    // bulk actions
    let bulkActions = this.props.bulk_actions || [];

    if (this.state.group === 'trash' && bulkActions.length > 0) {
      bulkActions = [
        {
          name: 'restore',
          label: MailPoet.I18n.t('restore'),
          onSuccess: this.props.messages.onRestore,
        },
        {
          name: 'delete',
          label: MailPoet.I18n.t('deletePermanently'),
          onSuccess: this.props.messages.onDelete,
        },
      ];
    }

    // item actions
    const itemActions = this.props.item_actions || [];

    const tableClasses = classNames(
      'mailpoet_listing_table',
      'wp-list-table',
      'widefat',
      'fixed',
      'striped',
      { mailpoet_listing_loading: this.state.loading }
    );

    // search
    let search = (
      <ListingSearch
        onSearch={this.handleSearch}
        search={this.state.search}
      />
    );
    if (this.props.search === false) {
      search = false;
    }

    // groups
    let groups = (
      <ListingGroups
        groups={this.state.groups}
        group={this.state.group}
        onSelectGroup={this.handleGroup}
      />
    );
    if (this.props.groups === false) {
      groups = false;
    }

    // messages
    let messages = {};
    if (this.props.messages !== undefined) {
      messages = this.props.messages;
    }
    let extraActions;
    if (typeof this.props.renderExtraActions === 'function') {
      extraActions = this.props.renderExtraActions(this.state);
    }

    return (
      <div>
        { groups }
        { search }
        <div className="tablenav top clearfix">
          <ListingBulkActions
            count={this.state.count}
            bulk_actions={bulkActions}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            onBulkAction={this.handleBulkAction}
          />
          <ListingFilters
            filters={this.state.filters}
            filter={this.state.filter}
            group={this.state.group}
            onBeforeSelectFilter={this.props.onBeforeSelectFilter || null}
            onSelectFilter={this.handleFilter}
            onEmptyTrash={this.handleEmptyTrash}
          />
          {extraActions}
          <ListingPages
            count={this.state.count}
            page={this.state.page}
            limit={this.state.limit}
            onSetPage={this.handleSetPage}
          />
        </div>
        <table className={tableClasses}>
          <thead>
            <ListingHeader
              onSort={this.handleSort}
              onSelectItems={this.handleSelectItems}
              selection={this.state.selection}
              sort_by={sortBy}
              sort_order={sortOrder}
              columns={columns}
              is_selectable={bulkActions.length > 0}
            />
          </thead>

          <ListingItems
            onRenderItem={this.handleRenderItem}
            getListingItemKey={this.props.getListingItemKey}
            onDeleteItem={this.handleDeleteItem}
            onRestoreItem={this.handleRestoreItem}
            onTrashItem={this.handleTrashItem}
            onRefreshItems={this.handleRefreshItems}
            columns={columns}
            is_selectable={bulkActions.length > 0}
            onSelectItem={this.handleSelectItem}
            onSelectAll={this.handleSelectAll}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            loading={this.state.loading}
            group={this.state.group}
            count={this.state.count}
            limit={this.state.limit}
            item_actions={itemActions}
            messages={messages}
            items={items}
          />

          <tfoot>
            <ListingHeader
              onSort={this.handleSort}
              onSelectItems={this.handleSelectItems}
              selection={this.state.selection}
              sort_by={sortBy}
              sort_order={sortOrder}
              columns={columns}
              is_selectable={bulkActions.length > 0}
            />
          </tfoot>

        </table>
        <div className="tablenav bottom">
          <ListingBulkActions
            count={this.state.count}
            bulk_actions={bulkActions}
            selection={this.state.selection}
            selected_ids={this.state.selected_ids}
            onBulkAction={this.handleBulkAction}
          />
          <ListingPages
            count={this.state.count}
            page={this.state.page}
            limit={this.state.limit}
            onSetPage={this.handleSetPage}
          />
        </div>
      </div>
    );
  },
});

module.exports = Listing;
