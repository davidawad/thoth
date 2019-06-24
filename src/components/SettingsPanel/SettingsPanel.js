
import React, { Component } from 'react';

import {SettingsPane, SettingsPage, SettingsContent} from 'react-settings-pane'

import './SettingsPanel.css';


let settings = {
    'readingSpeed': 500,
};

// Define your menu
const menu = [
    {
    title: 'Settings',          // Title that is displayed as text in the menu
    url: '/settings'  // Identifier (url-slug)
    },
];



class SettingsPanel extends Component {
    
     // Save settings after close

    // You will maybe receive your settings from this.props or do a fetch request in your componentWillMount
    //let settings = settings;


    
    // Save settings after close
    leavePaneHandler = (wasSaved, newSettings, oldSettings) => {
        // "wasSaved" indicates whether the pane was just closed or the save button was clicked.
    
        if (wasSaved && newSettings !== oldSettings) {
            // do something with the settings, e.g. save via ajax.
            
            // TODO save our settings after they've been changed.
            console.log("new settings: ", newSettings)

        }
    };
    
    
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
                                type="text" 
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