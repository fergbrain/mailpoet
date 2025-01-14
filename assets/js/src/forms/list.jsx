import React from 'react';
import classNames from 'classnames';
import MailPoet from 'mailpoet';
import jQuery from 'jquery';
import PropTypes from 'prop-types';
import Listing from '../listing/listing.jsx';

const columns = [
  {
    name: 'name',
    label: MailPoet.I18n.t('formName'),
    sortable: true,
  },
  {
    name: 'segments',
    label: MailPoet.I18n.t('segments'),
  },
  {
    name: 'signups',
    label: MailPoet.I18n.t('signups'),
  },
  {
    name: 'created_at',
    label: MailPoet.I18n.t('createdOn'),
    sortable: true,
  },
];

const messages = {
  onTrash: (response) => {
    const count = Number(response.meta.count);
    let message = null;

    if (count === 1) {
      message = (
        MailPoet.I18n.t('oneFormTrashed')
      );
    } else {
      message = (
        MailPoet.I18n.t('multipleFormsTrashed')
      ).replace('%$1d', count.toLocaleString());
    }
    MailPoet.Notice.success(message);
  },
  onDelete: (response) => {
    const count = Number(response.meta.count);
    let message = null;

    if (count === 1) {
      message = (
        MailPoet.I18n.t('oneFormDeleted')
      );
    } else {
      message = (
        MailPoet.I18n.t('multipleFormsDeleted')
      ).replace('%$1d', count.toLocaleString());
    }
    MailPoet.Notice.success(message);
  },
  onRestore: (response) => {
    const count = Number(response.meta.count);
    let message = null;

    if (count === 1) {
      message = (
        MailPoet.I18n.t('oneFormRestored')
      );
    } else {
      message = (
        MailPoet.I18n.t('multipleFormsRestored')
      ).replace('%$1d', count.toLocaleString());
    }
    MailPoet.Notice.success(message);
  },
};

const bulkActions = [
  {
    name: 'trash',
    label: MailPoet.I18n.t('moveToTrash'),
    onSuccess: messages.onTrash,
  },
];

const itemActions = [
  {
    name: 'edit',
    label: MailPoet.I18n.t('edit'),
    link: function link(item) {
      return (
        <a href={`admin.php?page=mailpoet-form-editor&id=${item.id}`}>{MailPoet.I18n.t('edit')}</a>
      );
    },
  },
  {
    name: 'duplicate',
    label: MailPoet.I18n.t('duplicate'),
    onClick: function onClick(item, refresh) {
      return MailPoet.Ajax.post({
        api_version: window.mailpoet_api_version,
        endpoint: 'forms',
        action: 'duplicate',
        data: {
          id: item.id,
        },
      }).done((response) => {
        MailPoet.Notice.success(
          (MailPoet.I18n.t('formDuplicated')).replace('%$1s', response.data.name)
        );
        refresh();
      }).fail((response) => {
        if (response.errors.length > 0) {
          MailPoet.Notice.error(
            response.errors.map((error) => error.message),
            { scroll: true }
          );
        }
      });
    },
  },
  {
    name: 'trash',
  },
];

class FormList extends React.Component {
  createForm = () => {
    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: 'forms',
      action: 'create',
    }).done((response) => {
      window.location = window.mailpoet_form_edit_url + response.data.id;
    }).fail((response) => {
      if (response.errors.length > 0) {
        MailPoet.Notice.error(
          response.errors.map((error) => error.message),
          { scroll: true }
        );
      }
    });
  };

  renderItem = (form, actions) => {
    const rowClasses = classNames(
      'manage-column',
      'column-primary',
      'has-row-actions'
    );

    let segments = window.mailpoet_segments
      .filter((segment) => (jQuery.inArray(segment.id, form.segments) !== -1))
      .map((segment) => segment.name)
      .join(', ');

    if (form.settings.segments_selected_by === 'user') {
      segments = `${MailPoet.I18n.t('userChoice')} ${segments}`;
    }

    return (
      <div>
        <td className={rowClasses}>
          <strong>
            <a
              className="row-title"
              href={`admin.php?page=mailpoet-form-editor&id=${form.id}`}
            >
              { form.name }
            </a>
          </strong>
          { actions }
        </td>
        <td className="column" data-colname={MailPoet.I18n.t('segments')}>
          { segments }
        </td>
        <td className="column" data-colname={MailPoet.I18n.t('signups')}>
          { form.signups }
        </td>
        <td className="column-date" data-colname={MailPoet.I18n.t('createdOn')}>
          <abbr>{ MailPoet.Date.format(form.created_at) }</abbr>
        </td>
      </div>
    );
  };

  render() {
    return (
      <div>
        <h1 className="title">
          {MailPoet.I18n.t('pageTitle')}
          {' '}
          <button
            className="page-title-action"
            href="javascript:;"
            onClick={this.createForm}
            data-automation-id="create_new_form"
            type="button"
          >
            {MailPoet.I18n.t('new')}
          </button>
        </h1>

        <Listing
          limit={window.mailpoet_listing_per_page}
          location={this.props.location}
          params={this.props.match.params}
          messages={messages}
          search={false}
          endpoint="forms"
          onRenderItem={this.renderItem}
          columns={columns}
          bulk_actions={bulkActions}
          item_actions={itemActions}
        />
      </div>
    );
  }
}

FormList.propTypes = {
  location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  match: PropTypes.shape({
    params: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  }).isRequired,
};

export default FormList;
