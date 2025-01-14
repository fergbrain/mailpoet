import Hooks from 'wp-js-hooks';
import MailPoet from 'mailpoet';
import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import NewsletterGeneralStats from './newsletter_stats.jsx';
import NewsletterStatsInfo from './newsletter_info.jsx';
import PremiumBanner from './premium_banner.jsx';

class CampaignStatsPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: {},
      loading: true,
    };
  }

  componentDidMount() {
    const { match } = this.props;
    // Scroll to top in case we're coming
    // from the middle of a long newsletter listing
    window.scrollTo(0, 0);
    this.loadItem(match.params.id);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      this.loadItem(this.props.match.params.id);
    }
  }

  loadItem(id) {
    const { history } = this.props;
    this.setState({ loading: true });
    MailPoet.Modal.loading(true);

    MailPoet.Ajax.post({
      api_version: window.mailpoet_api_version,
      endpoint: window.mailpoet_premium_active ? 'stats' : 'newsletters',
      action: window.mailpoet_premium_active ? 'get' : 'getWithStats',
      data: {
        id,
      },
    }).always(() => {
      MailPoet.Modal.loading(false);
    }).done((response) => {
      this.setState({
        loading: false,
        item: response.data,
      });
    }).fail((response) => {
      MailPoet.Notice.error(
        response.errors.map((error) => error.message),
        { scroll: true }
      );
      this.setState({
        loading: false,
        item: {},
      }, () => {
        history.push('/');
      });
    });
  }

  render() {
    const { item, loading } = this.state;
    const newsletter = item;
    const { match, location } = this.props;

    if (loading || !newsletter.queue) {
      return (
        <div>
          <h1 className="title">
            {MailPoet.I18n.t('statsTitle')}
            <Link
              className="page-title-action"
              to="/"
            >
              {MailPoet.I18n.t('backToList')}
            </Link>
          </h1>
        </div>
      );
    }

    return (
      <div>
        <h1 className="title">
          {`${MailPoet.I18n.t('statsTitle')}: ${newsletter.subject}`}
          <Link
            className="page-title-action"
            to="/"
          >
            {MailPoet.I18n.t('backToList')}
          </Link>
        </h1>

        <div className="mailpoet_stat_triple-spaced">
          <div className="mailpoet_stat_info">
            <NewsletterStatsInfo newsletter={newsletter} />
          </div>
          <div className="mailpoet_stat_general">
            <NewsletterGeneralStats newsletter={newsletter} />
          </div>
          <div style={{ clear: 'both' }} />
        </div>

        <h2>{MailPoet.I18n.t('clickedLinks')}</h2>

        <div className="mailpoet_stat_triple-spaced">
          {Hooks.applyFilters('mailpoet_newsletters_clicked_links_table', <PremiumBanner />, newsletter.clicked_links)}
        </div>

        <div className="mailpoet_stat_triple-spaced">
          {Hooks.applyFilters('mailpoet_newsletters_purchased_products', null, newsletter)}
        </div>

        <h2>{MailPoet.I18n.t('subscriberEngagement')}</h2>
        {Hooks.applyFilters('mailpoet_newsletters_subscriber_engagement', <PremiumBanner />, location, match.params, newsletter)}
      </div>
    );
  }
}

CampaignStatsPage.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.object.isRequired,
  }).isRequired,
  location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default withRouter(CampaignStatsPage);
