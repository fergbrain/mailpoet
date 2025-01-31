import React from 'react';
import PropTypes from 'prop-types';
import MailPoet from 'mailpoet';
import ReactStringReplace from 'react-string-replace';
import PreviousNextStepButtons from '../previous_next_step_buttons.jsx';

const kbLink = 'https://kb.mailpoet.com/article/126-importing-subscribers-with-csv-files';

const placeholder = 'Email, First Name, Last Name\njohn@doe.com, John, Doe\nmary@smith.com, Mary, Smith\njohnny@walker.com, Johnny, Walker';

const MethodPaste = ({
  onValueChange,
  canFinish,
  onFinish,
  data,
}) => {
  const onChange = (e) => {
    onValueChange(e.target.value);
  };

  return (
    <>
      <label htmlFor="paste_input" className="mailpoet_import_method_paste">
        <div className="mailpoet_import_paste_texts">
          <span className="mailpoet_import_heading">{MailPoet.I18n.t('pasteLabel')}</span>
          <p className="description">
            {ReactStringReplace(
              MailPoet.I18n.t('pasteDescription'),
              /\[link\](.*?)\[\/link\]/,
              (match) => (
                <a
                  href={`${kbLink}`}
                  key="kb-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  { match }
                </a>
              )
            )}
          </p>
        </div>
        <textarea
          id="paste_input"
          rows="15"
          placeholder={placeholder}
          className="regular-text code"
          onChange={onChange}
          defaultValue={data}
        />
      </label>
      <PreviousNextStepButtons
        canGoNext={canFinish}
        hidePrevious
        onNextAction={onFinish}
      />
    </>
  );
};

MethodPaste.propTypes = {
  onFinish: PropTypes.func,
  canFinish: PropTypes.bool.isRequired,
  onValueChange: PropTypes.func.isRequired,
  data: PropTypes.string,
};

MethodPaste.defaultProps = {
  onFinish: () => {},
  data: '',
};

export default MethodPaste;
