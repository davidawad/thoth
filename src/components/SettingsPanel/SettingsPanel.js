import React, { Component } from "react";

class SettingsPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      readingSpeed: Number(this.props.readingSpeed),
      baseColorStop: String(this.props.baseColorStop),
      finalColorStop: String(this.props.finalColorStop),
      settingsEnabled: Boolean(this.props.settingsEnabled),
      age: Number(this.props.age),
    };
  }

  leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
    if (wasSaved && newSettings !== oldSettings) {
      this.props.updateCallback(newSettings);
    }
  };

  componentWillReceiveProps(props) {
    this.setState(props);
  }

  render() {
    return <></>;
  }
}

export default SettingsPanel;
