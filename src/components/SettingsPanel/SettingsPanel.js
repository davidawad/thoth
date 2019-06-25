
import React, { Component } from 'react';


// TODO remove this jank settings pane that doesn't work.
import {SettingsPane, SettingsPage, SettingsContent} from 'react-settings-pane'

import './SettingsPanel.css';
import Settings from '../Settings'


let defaults = new Settings();

// default settings object. 
let settings = defaults;


// Define your menu
const menu = [
    {
    title: 'Settings',          // Title that is displayed as text in the menu
    url: '/settings'  // Identifier (url-slug)
    },
];



class SettingsPanel extends Component {

    /* 
    constructor(props) {
        super(props);
    };
    */
    

    /* Save settings when save button is hit */
    leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
        // "wasSaved" indicates whether the pane was just closed or the save button was clicked.
    
        if (wasSaved && newSettings !== oldSettings) {
            // do something with the settings, e.g. save via ajax.
            
            // save our settings after they've been changed.
            this.props.updateCallback(newSettings);

        }
    };
    
    /* when any form change is made */
    settingsChanged = function(changedSettings) {
        // this is triggered onChange of the inputs
        console.log("settings changed!", changedSettings);
    };


    // render function of a random component 
    render() {


        // Return your Settings Pane
        return (
            <SettingsPane 
                items={menu} 
                index="/settings" 
                ariaHideApp={false}
                settings={settings} 
                onPaneLeave={this.leavePaneHandler}>

                <SettingsContent
                saveButtonClass="primary"
                >
                    <SettingsPage 
                    handler="/settings" 
                    saveButtonClass="SettingsSave"
                    closeButtonClass="hide noshow"
                    >
                    

                        <fieldset className="form-group">
                            <label>Reading Speed: </label>
                            <input 
                                type="number" 
                                className="form-control" 
                                name="readingSpeed" 
                                placeholder="500" 
                                id="readingSpeed" 
                                onChange={this.settingsChanged} 
                                defaultValue={settings['readingSpeed']} />
                        </fieldset>

                    </SettingsPage>

                </SettingsContent>
                    
            </SettingsPane>
        )

    }


}

export default SettingsPanel;