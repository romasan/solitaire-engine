'use strict';

import event    from 'event';
import share    from 'share';
import defaults from 'defaults';
import common   from 'common';

// Actions
import twindeck       from 'twindeckAction';
import dealerdeck     from 'dealerdeckAction';
import kickAction     from 'kickAction';
import stepsAround    from 'stepsAroundAction';
import changeStepType from 'changeStepTypeAction';
import lock           from 'lockAction';
import unlock         from 'unlockAction';

let _actions = {
	"twindeck"       : twindeck      ,
	"dealerdeck"     : dealerdeck    ,
	"kick"           : kickAction    ,
	"stepsAround"    : stepsAround   ,
	"changeStepType" : changeStepType,
	"lock"           : lock          ,
	"unlock"         : unlock
};

// ------------------------------------------------------------------------------------------

let _decksActions  = [],
    _events        = [];

event.listen('initField', () => {
	_decksActions = [];
	_events       = [];
})

let addActionEvent = (_event) => {

	event.listen(

		// event name
		_event, 
		
		// callback
		(data) => {

			for(let i in _decksActions) {
				if(_decksActions[i].event == _event) {
					
					let _actionName = _decksActions[i].action;

					let _canRun = _event == 'click'
					    ? data.to.name == _decksActions[i].deck.name
					    : true;
					
					if(_canRun) {
						
						_actions[_actionName].call(
							
							_decksActions[i].deck, 
							
							{
								actionData : _decksActions[i].deck.actions[_actionName],
								eventData  : data,
								eventName  : _event
							}
						);
					};
				}
			}
		},

		// context
		'addActionEvent:' + _event
	);

};

let addActions = function() {

	for(let actionName in this.actions) {

		// если не описано событие выполнять по клику
		if(!this.actions[actionName].event) {
			this.actions[actionName].event = 'click';
		}

		if(_actions[actionName]) {
			_decksActions.push({
				deck   : this, 
				event  : this.actions[actionName].event,
				action : actionName
			});

			if(_events.indexOf(this.actions[actionName].event) < 0) {
				// КОПАТЬ ТУТ
				_events.push(this.actions[actionName].event);
				addActionEvent(this.actions[actionName].event);
			}
		} else {
			console.warn('Action', actionName, 'for', this.name, 'not found.');
		};

	}
	autoRunActions(this.actions);
};

let autoRunActions = (data) => {// bind this deck

	common.animationDefault();

	for(let actionName in data.actions) {
		if(data.actions[actionName].autorun) {
			if(_actions[actionName]) {
				_actions[actionName].call(
					data, 
					{
						actionData : data.actions[actionName],
						eventData  : null,
						eventName  : data.actions[actionName].event
					}
				);
			}
		}
	}
	// Tips.checkTips();
}

export default {
	addActions
}