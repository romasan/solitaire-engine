'use strict';

import event        from 'event'       ;
import share        from 'share'       ;
import common       from 'common'      ;
import defaults     from 'defaults'    ;

import inputs       from 'inputs'      ;
import History      from 'history'     ;
import Tips         from 'tips'        ;
import atom         from 'atom'        ;
import stateManager from 'stateManager';
import undo         from 'undo'        ;

/*
 * flip
 * unflip
 * hide
 * show
 * full
 * lock
 * unlock
 * swap
 * move
 * markCard
 * unmarkCard
 */

let redo = data => {

	if(share.get('sessionStarted')) {

		event.dispatch('stopAnimations');
		stateManager.restore();
	}

	// redo flip
	if(data.flip) {

		let deck = common.getElementByName(data.flip.deckName);

		let card = deck.getCardByIndex(data.flip.cardIndex | 0);

		if(
			card                            &&
			card.name == data.flip.cardName
		) {
			card.flip = true;
			deck.Redraw();
		}
	}

	// redo unflip
	if(data.unflip) {

		console.log('Unflip');

		let deck = common.getElementByName(data.unflip.deckName, 'deck');

		let card = deck.getCardByIndex(data.unflip.cardIndex | 0);

		if(
			card                              &&
			card.name == data.unflip.cardName
		) {
			card.flip = false;
			deck.Redraw();
		}
	}

	// redo hide
	if(data.hide) {

		let deck = common.getElementByName(data.hide.deckName, 'deck');

		if(
			deck                                                       &&
			deck.cards[data.hide.cardIndex].name == data.hide.cardName // TODO check
		) {
			deck.cards[data.hide.cardIndex].visible = false;
			deck.Redraw();
		} else {
			console.warn('Incorrect history substep [redo hide]:', data.hide);
		}
	}

	// redo show
	if(data.show) {

		let deck = common.getElementByName(data.show.deckName, 'deck');

		if(
			deck                                                       &&
			deck.cards[data.show.cardIndex].name == data.show.cardName
		) {
			deck.cards[data.show.cardIndex].visible = true;
			deck.Redraw();
		} else {
			console.warn('Incorrect history substep [redo show]:', data.hide);
		}
	}
	
	// redo full
	if(data.full) {
		// 
	}

	// redo lock
	if(
		typeof data.lock != 'undefined'
	) {
		for(let i in data.lock) {
			let _element = common.getElementsByName(data.lock[i])[0];
			_element.lock();
		}
	}

	// redo unlock
	if(
		typeof data.unlock != 'undefined'
	) {
		for(let i in data.unlock) {
			let _element = common.getElementsByName(data.unlock[i])[0];
			_element.unlock();
		}
	}

	// redo swap
	if(
		typeof data.swap           != 'undefined' &&
		typeof data.swap.deckName  != 'undefined' &&
		typeof data.swap.fromIndex != 'undefined' &&
		typeof data.swap.toIndex   != 'undefined'
	) {

		let deck = common.getElementByName(data.swap.deckName, 'deck');

		atom.swap(deck, data.swap.fromIndex, data.swap.toIndex, false);

		deck.Redraw();
	}

	// redo move
	if(
		typeof data.move      != 'undefined' &&
		typeof data.move.from != 'undefined' &&
		typeof data.move.to   != 'undefined' &&
		typeof data.move.deck != 'undefined'
	) {

		if(data.move.stepType) {

			if(typeof data.move.stepType == 'string') {
				share.set('stepType', data.move.stepType);
			}

			if(typeof data.move.stepType.redo == 'string') {
				share.set('stepType', data.move.stepType.redo);
			}
		}

		let forceMoveData = {
			"from" : data.move.from,
			"to"   : data.move.to  ,
			"deck" : data.move.deck,
			"flip" : data.move.flip
		};

		// if(typeof data.move.flip == "boolean") {
		// 	forceMoveData.flip = data.move.flip;
		// }

		if(!share.get('showHistoryAnimation')) {

			common.animationOff();

			forceMoveData.callback = e => {
				common.animationOn();
			};
		}

		event.dispatch('forceMove', forceMoveData);
	}

	if(data.markCard) {
		
		let deck = common.getElementByName(data.markCard.deckName, 'deck');

		let card = deck.getCardByIndex(data.markCard.cardIndex | 0);

		if(
			card                                &&
			data.markCard.cardName == card.name
		) {
			event.dispatch('markCard', {
				"card" : card
			});
		}
	}

	if(data.unmarkCard) {

		let deck = common.getElementByName(data.unmarkCard.deckName, 'deck');

		let card = deck.getCardByIndex(data.unmarkCard.cardIndex | 0);

		if(
			card                                  &&
			data.unmarkCard.cardName == card.name
		) {
			event.dispatch('unmarkCard', {
				"card" : card
			});
		}
	}

	// TODO актуально ли ещё?
	// if(
	// 	data.redo                            &&
	// 	typeof data.redo.stepType == 'string'
	// ) {
	// 	share.set('stepType', data.redo.stepType);
	// }
};

event.listen('redo', redoData => {

	if(!redoData || share.get('stopRunHistory')) {
		return;
	}

	console.log('%cREDO: ' + JSON.stringify(redoData), 'background:#fff7d6');

	inputs.break();

	// History.reset();
	let history = History.get();
	for(let i in history) {
		undo(history[i]);
	}

	if(share.get('animation')) {
		event.dispatch('stopAnimations');
	}

	// Обратная совместимость
	if(redoData instanceof Array) {

		for(let _i in redoData) {
			let data = redoData[_i];
			redo(data);
		}
	} else {
		redo(redoData);
	}

	Tips.checkTips();

	// TODO актуально ли ещё?
	// if(
	// 	share.get('stepType') != defaults.stepType &&
	// 	Tips.getTips().length == 0
	// ) {
	// 	share.set('stepType', defaults.stepType);
	// 	Tips.checkTips();
	// }
});

export default redo;