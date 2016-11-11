'use strict';

import event            from 'event';
import share            from 'share';
import defaults         from 'defaults';
import common           from 'common';

import deckAction       from 'deckAction';
import lockActionCommon from 'lockActionCommon';

class lockAction extends deckAction {
	
	constructor() {
		super();
	}

	run(deck, data) {

		if(data.eventData.to.name != deck.name) {
			return false;
		}

		lockActionCommon(data.actionData, 'lock', deck.name);

		// !data.actionData.dispatch
		super.end();
	}

}

export default new lockAction();