import React, { Component } from 'react';

// TODO remove this jank settings pane that doesn't work.
import {
  SettingsPane,
  SettingsPage,
  SettingsContent
} from 'react-settings-pane';

import './SettingsPanel.css';
// import Settings from '../Settings'

import * as CONSTANTS from '../constants';

let READING_SPEED = CONSTANTS.DEFAULT_READING_SPEED; // in words-per-minute (wpm)
let START_COLOR = CONSTANTS.START_COLOR;
let STOP_COLOR = CONSTANTS.STOP_COLOR;

// let defaults = new Settings();

// default settings object.
let settings = {};

// Define your menu
const menu = [
  {
    title: 'Settings', // Title that is displayed as text in the menu
    url: '/settings' // Identifier (url-slug)
  }
];

class SettingsPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      readingSpeed: Number(this.props.readingSpeed),
      baseColorStop: String(this.props.baseColorStop),
      finalColorStop: String(this.props.finalColorStop)
    };
  }

  /* Save settings when save button is hit */
  leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
    // "wasSaved" indicates whether the pane was just closed or the save button was clicked.

    if (wasSaved && newSettings !== oldSettings) {
      // do something with the settings, e.g. save via ajax.

      // save our settings after they've been changed.
      this.props.updateCallback(newSettings, function() {
        console.log('state updated.');
      });
    }
  };

  // when parent updates state, this component gets re-rendered

  componentWillReceiveProps(props) {
    this.setState(props);
  }

  render() {
    // Return your Settings Pane
    return (
      <SettingsPane
        items={menu}
        index="/settings"
        ariaHideApp={false}
        settings={settings}
        onPaneLeave={this.leavePaneHandler}
      >
        <SettingsContent saveButtonClass="saveButton">
          <SettingsPage
            handler="/settings"
            saveButtonClass="SettingsSave"
            closeButtonClass="hide noshow"
          >
            <fieldset className="form-group">
              <label>Reading Speed: </label>
              <input
                className="form-control"
                name="readingSpeed"
                placeholder={String(READING_SPEED) + ' Words Per Minute (WPM)'}
                defaultValue={this.state.readingSpeed}
              />
            </fieldset>

            <fieldset className="form-group">
              <label>Base Color Stop: </label>
              <input
                className="form-control"
                name="baseColorStop"
                placeholder={START_COLOR}
                defaultValue={this.state.baseColorStop}
              />
            </fieldset>

            <fieldset className="form-group">
              <label>Final Color Stop: </label>
              <input
                className="form-control"
                name="finalColorStop"
                placeholder={STOP_COLOR}
                defaultValue={this.state.finalColorStop}
              />
            </fieldset>
          </SettingsPage>

          <br />
        </SettingsContent>
      </SettingsPane>
    );
  }
}

export default SettingsPanel;
