'use strict'

import event        from '../common/event';
import share        from '../common/share';
import common       from '../common'      ;

import Field        from '../field'       ;
import history      from './'             ;
import redoAdvanced from './redoAdvanced' ;
import snapshot     from './snapshot'     ;


/*
 * Events:
 *
 * addStep
 * saveSteps
 * doHistory
 * scanAttempts
 * resetHistory
 * newGame
 * quickHistoryMove
 */

event.listen('addStep', data => {

	if (data.step) {

		let stepId = history.add(data.step);

		if (typeof data.callback == "function") {
			data.callback(stepId);
		}
	} else {
		history.add(data);
	}
});

// save steps to client history
event.listen('saveSteps', e => {

	let data = history.get();

	// console.groupCollapsed('%c### saveSteps', 'font-weight: bold; color: green;');
	// console.log('%c' + JSON.stringify(data, true, 2), 'background: #cceacc;');
	// console.groupEnd();

	if (data.length) {
		event.dispatch('makeStep', data);
	} else {
		console.warn('Empty history to save.');
	}
});

event.listen('doHistory', e => {

	// if (share.get('noReplayHistory')) {
	// 	return;
	// }

	console.groupCollapsed('DO HISTORY');

	let _time = Date.now();

	// common.animationOff();
	if (!e || !e.data) {
		console.warn('doHistory data:', e);
	}

	// event.dispatch('stopRunHistory');
	common.animationOff();

	// console.log('doHistory:start');
	for (let i in e.data) {

		// share.set('noSave', true);
		event.dispatch('redo', e.data[i]);
		// share.set('noSave', false);

		if (
			!redoAdvanced.handle(e.data[i][0]) &&
			typeof e.callback == 'function'
		) {
			e.callback(e.data[i]);	
		}
	}
	// console.log('doHistory:end');

	common.animationDefault();
	// event.dispatch('startRunHistory');

	// After doing history

	event.dispatch('doHistory:end');

	setTimeout(Field.Redraw, 0);

	// let _decks = common.getElementsByType('deck');

	// for (let deckIndex in _decks) {}

	console.log(((Date.now() - _time) / 1e3) + 's.');

	console.groupEnd();
});

event.listen('scanAttempts', data => {

	// Field.clear();

	console.groupCollapsed('scanAttempts');
	let _time = Date.now();

	event.dispatch('render:off');
	common.animationOff();

	let stateDifferences = [];

	for (let attemptIndex in data.attempts) {

		let history = data.attempts[attemptIndex];

		// console.log('scanAttempts:attempts', attemptIndex, history);

		if (history) {

			let snap = snapshot.get();

			for (let i in history) {

				event.dispatch('redo', history[i]);

				redoAdvanced.handle(history[i][0]);
			}

			let snap2 = snapshot.get();

			stateDifferences.push(snapshot.diff(snap, snap2));

			if (
				attemptIndex < data.attempts.length - 1 &&
				typeof data.callback == "function"
			) {
				data.callback();
			}
		}
	}

	let summary = snapshot.summary(stateDifferences);

	event.dispatch('render:on');
	common.animationDefault();

	if (typeof data.callback == "function") {
		data.callback();
	}

	snapshot.applyState(summary, {
		"flip" : "prevFlip"
	});

	console.log(((Date.now() - _time) / 1e3) + 's.');

	console.groupEnd();
});

event.listen('resetHistory', e => {
	history.reset();
});

event.listen('deleteHistory', steps => {
	history.delete(steps);
});

event.listen('newGame', e => {
	history.reset();
});

event.listen('quickHistoryMove', callback => {

	if (typeof callback) {

		common.animationOff();

		callback();

		common.animationOn();
	}
})
