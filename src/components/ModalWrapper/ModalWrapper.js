import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import SettingsPanel from '../SettingsPanel/SettingsPanel';


import './ModalWrapper.css';


const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
// Modal.setAppElement('#yourAppElement')


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
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = '#f00';
  }

  closeModal() {
    this.setState({
            modalIsOpen: false
        });
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
          // className="ModalWrapper"
          contentLabel="SettingsModal ContentLabel"
        >

          <h2 ref={subtitle => this.subtitle = subtitle}>Settings</h2>
          
          {/* pass along the callback to update reader state with new settings */}
          <SettingsPanel
            updateCallback={this.props.updateCallback}
          />


          <button onClick={this.closeModal}>close</button>

        </Modal>
      </div>
    );
  }
}

export default ModalWrapper; 







