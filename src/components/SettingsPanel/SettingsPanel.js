import React, { Component } from "react";

import TextParsingTools from "../TextParsingTools";
import * as CONSTANTS from "../constants";

class SettingsPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      readingSpeed: Number(this.props.readingSpeed),
      baseColorStop: String(this.props.baseColorStop),
      finalColorStop: String(this.props.finalColorStop),
      settingsEnabled: Boolean(this.props.settingsEnabled),
      age: Number(this.props.age),
      readabilityMetric:
        this.props.readabilityMetric || CONSTANTS.DEFAULT_READABILITY_METRIC,
    };

    this.handleReadabilityMetricChange =
      this.handleReadabilityMetricChange.bind(this);
  }

  leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
    if (wasSaved && newSettings !== oldSettings) {
      this.props.updateCallback(newSettings);
    }
  };

  componentWillReceiveProps(props) {
    this.setState(props);
  }

  // fires the moment the user picks a new metric - reuses the existing
  // updateCallback pattern so the choice flows straight up to pages/index.js
  // state (which also persists it to localStorage).
  handleReadabilityMetricChange(event) {
    const readabilityMetric = event.target.value;

    this.setState({ readabilityMetric });
    this.props.updateCallback({ readabilityMetric });
  }

  render() {
    return (
      <fieldset className="form-group thoth-readability-settings">
        <legend>Readability</legend>

        <label htmlFor="readabilityMetric">
          Difficulty metric driving reading speed:
        </label>
        <select
          id="readabilityMetric"
          name="readabilityMetric"
          className="form-control"
          value={this.state.readabilityMetric}
          onChange={this.handleReadabilityMetricChange}
        >
          {TextParsingTools.READABILITY_METRICS.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </fieldset>
    );
  }
}

export default SettingsPanel;
