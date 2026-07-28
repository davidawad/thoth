import React, { Component } from "react";
import Modal from "react-modal";
import SettingsPanel from "../SettingsPanel/SettingsPanel";

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)"
  }
};

class ModalWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modalIsOpen: false
    };

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  openModal() {
    this.setState({
      modalIsOpen: true
    });
  }

  afterOpenModal() {
    this.subtitle.style.color = "#f00";
  }

  closeModal() {
    this.setState({
      modalIsOpen: false
    });
  }

  // Update state when props change
  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.setState(this.props);
    }
  }

  render() {
    return (
      <div>
        <button onClick={this.openModal}>Settings</button>

        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          ariaHideApp={false}
          style={customStyles}
          contentLabel="SettingsModal ContentLabel"
        >
          <h2 ref={(subtitle) => (this.subtitle = subtitle)}>Settings</h2>

          {/* pass along the callback to update reader state with new settings */}

          <SettingsPanel
            updateCallback={this.props.updateCallback}
            {...this.props}
          />

          <div className="closeButtonWrapper">
            <button onClick={this.closeModal}>Close</button>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ModalWrapper;
