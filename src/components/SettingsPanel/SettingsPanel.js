
import React, { Component } from 'react';


// TODO remove this jank settings pane that doesn't work.
import {SettingsPane, SettingsPage, SettingsContent} from 'react-settings-pane'

import './SettingsPanel.css';
// import Settings from '../Settings'


// let defaults = new Settings();

// default settings object. 
// let settings = defaults;


// Define your menu
const menu = [
    {
    title: 'Settings',  // Title that is displayed as text in the menu
    url: '/settings'    // Identifier (url-slug)
    },
];



class SettingsPanel extends Component {

     
    constructor(props) {
        super(props);

        this.state = {
            readingSpeed: Number(this.props.readingSpeed),
        };
    };
    
    

    /* Save settings when save button is hit */
    leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
        // "wasSaved" indicates whether the pane was just closed or the save button was clicked.
    
        if (wasSaved && newSettings !== oldSettings) {
            // do something with the settings, e.g. save via ajax.
            
            // save our settings after they've been changed.
            this.props.updateCallback(newSettings, 
                function(){
                    console.log("state updated.");
                }
            );

        }
    };


    // when parent updates state, this component gets re-rendered
    
    componentWillReceiveProps(props) {
        this.setState(props)
    }
    


    render() {

        console.log("READING SPEED BEING RENDERED IS: ", this.state.readingSpeed)

        // Return your Settings Pane
        return (
            <SettingsPane 
                items={menu} 
                index="/settings" 
                ariaHideApp={false}
                // settings={settings} 
                onPaneLeave={this.leavePaneHandler}>

                <SettingsContent
                saveButtonClass="saveButton"
                >
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
                                placeholder="500" 

                                defaultValue={this.state.readingSpeed} />
                        </fieldset>

                    </SettingsPage>

                    <br/>

                </SettingsContent>
                    
            </SettingsPane>
        )

    }


}

export default SettingsPanel;