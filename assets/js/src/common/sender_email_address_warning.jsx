import React from 'react';
import PropTypes from 'prop-types';
import MailPoet from 'mailpoet';
import ReactStringReplace from 'react-string-replace';

const userHostDomain = window.location.hostname.replace('www.', '');
const suggestedEmailAddress = `contact@${userHostDomain}`;

const SenderEmailAddressWarning = ({ emailAddress, mssActive }) => {
  if (mssActive) return null;
  const emailAddressDomain = emailAddress.split('@').pop().toLowerCase();
  if (window.mailpoet_free_domains.indexOf(emailAddressDomain) > -1) {
    return (
      <React.Fragment>
        <p
          className="sender_email_address_warning"
          data-acceptance-id="freemail-sender-warning-old-installation"
        >
          {MailPoet.I18n.t('senderEmailAddressWarning1')}
        </p>
        <p className="sender_email_address_warning">
          {ReactStringReplace(
            MailPoet.I18n.t('senderEmailAddressWarning2'),
            /(%suggested|%originalSender|<em>.*<\/em>)/,
            (match) => {
              if (match === '%suggested') return suggestedEmailAddress;
              if (match === '%originalSender') return <em key="sender-email">{ emailAddress }</em>;
              return <em key="reply-to">{match.replace(/<\/?em>/g, '')}</em>;
            }
          )}
        </p>
        <p className="sender_email_address_warning">
          <a
            href="https://kb.mailpoet.com/article/259-your-from-address-cannot-be-yahoo-com-gmail-com-outlook-com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {MailPoet.I18n.t('senderEmailAddressWarning3')}
          </a>
        </p>
      </React.Fragment>
    );
  }
  return null;
};

SenderEmailAddressWarning.propTypes = {
  emailAddress: PropTypes.string.isRequired,
  mssActive: PropTypes.bool.isRequired,
};

export default SenderEmailAddressWarning;
