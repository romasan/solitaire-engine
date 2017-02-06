'use strict';

import event    from 'event'   ;
import share    from 'share'   ;
import defaults from 'defaults';
import common   from 'common'  ;

import Deck     from 'deck'    ;
import Tips     from 'tips'    ;
import bestTip  from 'bestTip' ;
import winCheck from 'winCheck';
import Field    from 'field'   ;

let Move = (moveDeck, to, cursorMove) => {

	common.animationDefault();

	let _deck_departure   = moveDeck[0].card.parent                        &&
	                        common.getElementById(moveDeck[0].card.parent)   , // стопка из которой взяли
	    _deck_destination = null                                             , // в которую положили
	    _success          = true                                             ; // флаг возможности хода

	let _stepType = share.get('stepType');

	if(
		!cursorMove.dbclick           &&
		cursorMove.distance === 0     &&
		share.get('moveDistance') > 0 &&
		_stepType == defaults.stepType
	) {
		// кликнули один раз
		// чтобы сделать ход нужно переместить карту стопку (moveDistance != 0)
		return false;
	}

	// выйти если не стандартный ход
	if(
		_stepType != defaults.stepType  &&
		(
			Field.autoSteps             &&
			!Field.autoSteps[_stepType] ||
			!Field.autoSteps
		)
	) {

		let _deck_departure = moveDeck[0].card.parent && common.getElementById(moveDeck[0].card.parent);

		event.dispatch('moveCardToHome', {
			"moveDeck"  : moveDeck             ,
			"departure" : _deck_departure      ,
			"stepType"  : share.get('stepType')
		});

		return;
	}

	event.dispatch('startSession', {
		"type": 'move'
	});

	_success = _success && to; // to - не пустой

	let _el = null;

	if(_success) {
		_el = common.getElementById(to); // получаем карту/стопку
	}

	_success = _success && _el;

	// если положили на карту узнаём из какой она стопки
	if(_success) {
		if(_el.type == 'card') {
			_deck_destination = common.getElementById(_el.parent)
		} else if(_el.type == 'deck') {
			_deck_destination = _el;
		}
	}

	_success = _success && _deck_destination;

	// _deck_departure = moveDeck[0].card.parent && common.getElementById(moveDeck[0].card.parent);
	_success = _success && _deck_departure;

	_success = _success && _deck_destination.id != _deck_departure.id;

	// смотрим не одна и та же ли эта стопка
	if(_success) {

		// узнаём можно ли положить карты на папку назначения
		let _put = _deck_destination.Put(moveDeck);
		_success = _success && _put;

		if(_put) {// } && _deck_departure) {

			// если можно положить карты берём их из исходной стопки
			let _pop = _deck_departure.Pop(moveDeck.length);
			_success = _success && _pop;

			if(_pop) {

				// ложим карты в колоду назначения
				_deck_destination.Push(_pop);

				// режим анимации по умолчанию
				common.animationDefault();

				let _checkMoveEnd = false;

				for(let _actionName in _deck_destination.actions) {
					if(_deck_destination.actions[_actionName].event == 'moveEnd') {
						_checkMoveEnd = true;
					}
				}

				event.dispatch('addStep', {
					"move" : {
						"from"     : _deck_departure  .name      ,
						"to"       : _deck_destination.name      ,
						"deck"     : Deck.deckCardNames(moveDeck),
						"stepType" : {
							"undo" : _stepType,
							"redo" : _checkMoveEnd ? 'specialStepType' : _stepType
						},
						"context"  : "move"
					}
				});

				let issetMoves = null;

				// let _stop = false;
				let _callback = e => {

					// if(_stop) {
					// 	return;
					// }

					if(
						// !event.has('moveEnd', {
						!event.has('actionEvent:moveEnd:' + _deck_destination.name, {
							tag: event.tags.inGame
						}) ||
						share.get('autoStep:stepType') == share.get('stepType')
					) {
						event.dispatch('stopSession');
					}

					Tips.checkTips();

					let _tips = Tips.getTips();
					if(
						_deck_destination.save                             ||
						_tips.length > 0 && _stepType != defaults.stepType
					) {
						event.dispatch('saveSteps', 'MOVE');
					}

					event.dispatch('moveEnd:' + share.get('stepType'));
					event.dispatch('moveEnd', {
						"from"     : _deck_departure      ,
						"to"       : _deck_destination    ,
						"moveDeck" : moveDeck             ,
						"stepType" : share.get('stepType'),
						"before"   : data => {
							if(data && typeof data.stepType == 'string') {
								event.dispatch('addStep', {
									"redo": {
										"stepType": data.stepType
									}
								})
							}
						}
					});

					winCheck.winCheck({
						"show" : true
					});
				};

				// event.once('clearCallbacks', e => {
				// 	_stop = true;
				// });

				event.dispatch('moveDragDeck', {
					"departure"   : _deck_departure  ,
					"destination" : _deck_destination,
					"moveDeck"    : moveDeck         ,
					"callback"    : _callback
				});
			}
		}
	}

	// если не кдалось положить карты, вернуть обратно
	// или положить на лучшее возможное место
	if(!_success && _deck_departure) {

		// достаточно ли перетащили (если клика не достаточно и не двойной клик)
		if(
			Field.inputParams.doubleClick                    &&
			cursorMove.dbclick                               ||
			cursorMove.distance >= share.get('moveDistance')
		) {
				let Tip = bestTip(moveDeck, cursorMove);

				if(Tip) {
					Move(moveDeck, Tip.to.deck.id, cursorMove);

					return;
				} else {
					event.dispatch('moveCardToHome', {
						"moveDeck"  : moveDeck       ,
						"departure" : _deck_departure
					});
					// ^ callback
					event.dispatch('stopSession');
				}

		} else {
			event.dispatch('moveCardToHome', {
				"moveDeck"  : moveDeck       ,
				"departure" : _deck_departure
			});
			// ^ callback
			event.dispatch('stopSession');
		}
	}
};

event.listen('Move', data => {
	Move(data.moveDeck, data.to, data.cursorMove);
});

event.listen('autoStepToHome', e => {

	let _tips = Tips.getTips();

	// TODO

	// Move(_moveDeck, _to, _cursorMove);
});