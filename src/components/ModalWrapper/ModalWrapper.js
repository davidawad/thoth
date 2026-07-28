import React, { Component } from "react";
import Modal from "react-modal";
import SettingsPanel from "../SettingsPanel/SettingsPanel";

// react-modal ships hardcoded inline defaults (e.g. a white content
// background, its own top/left/transform centering) that would either clash
// with the dark/sepia themes or fight daisyui's own `.modal`/`.modal-box`
// layout. Rather than fight inline-style specificity, we reduce react-modal's
// own box to an inert, full-viewport passthrough (transparent, no border, no
// centering transform - a `transform` on an ancestor would break daisyui's
// `.modal` from positioning `fixed` against the real viewport) and let
// daisyui's own classes (rendered inside, see render() below) own the
// backdrop + centering + theme colors.
const customStyles = {
  overlay: {
    backgroundColor: "transparent",
    zIndex: 50
  },
  content: {
    position: "fixed",
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: "none",
    background: "transparent",
    border: "none",
    borderRadius: 0,
    padding: 0
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
    // (previously forced the heading to hardcoded red here, which fought
    // with the daisyui theme - text color now just comes from
    // `.modal-box`'s `text-base-content` class in render()).
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
        <button className="btn btn-sm" onClick={this.openModal}>
          Settings
        </button>

        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          ariaHideApp={false}
          style={customStyles}
          contentLabel="SettingsModal ContentLabel"
        >
          {/* `.modal.modal-open` gives us daisyui's own backdrop + centering
              (react-modal already only mounts this while open, so the class
              is unconditional here); `.modal-box` is themed via
              bg-base-100/text-base-content, tracking light/dark/sepia. */}
          <div className="modal modal-open">
            <div className="modal-box bg-base-100 text-base-content max-w-measure-narrow max-h-[80vh] overflow-y-auto">
              <h2
                className="text-xl font-bold mb-4"
                ref={(subtitle) => (this.subtitle = subtitle)}
              >
                Settings
              </h2>

              {/* pass along the callback to update reader state with new settings */}

              <SettingsPanel
                updateCallback={this.props.updateCallback}
                {...this.props}
              />

              <div className="closeButtonWrapper mt-4">
                <button className="btn btn-sm" onClick={this.closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  }
}

export default ModalWrapper;
