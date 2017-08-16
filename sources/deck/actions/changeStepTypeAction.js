'use strict';

import event      from '../../common/event'   ;
import share      from '../../common/share'   ;
import defaults   from '../../common/defaults';
import common     from '../../common'         ;

import deckAction from './deckAction'         ;

class changeStepTypeAction extends deckAction {

	constructor() {
		super();
	}

	run(deck, data) {

		if (data.eventData.to.name != deck.name) {
			return false;
		}

		if (typeof data.actionData.to != 'string') {

			// !data.actionData.dispatch
			super.end();

			return;
		} else {

			// !data.actionData.dispatch
			super.end();
			
			share.set('stepType', data.actionData.to);
		}
	}
}

export default new changeStepTypeAction();