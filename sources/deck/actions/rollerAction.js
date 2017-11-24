'use strict';

import event      from '../../common/event';
import share      from '../../common/share';

import deckAction from './deckAction'      ;
import Deck       from '../'               ;
import History    from '../../history'     ;
import Atom       from '../atom'           ;

const defaultOpenCount = 3;

class rollerAction extends deckAction {

	constructor() {
		super();
	}

	run(deck, data) {

		console.log('rollerAction:run', deck, data);

		if (
			!deck                   ||
			!data                   ||
			!deck.cards             ||
			 deck.cards.length == 0
		) {
			console.log('rollerAction:run -> break #0');
			return;
		}

		// Не сохранять если ход из истории
		let _save = data.eventName == 'moveEnd:force' ? false : true; // !share.get('noSave');
		console.log('rollerAction:run -> _save:', _save);

		/* *********************************************************************
		 * действие совершаемое после хода из стопки
		 * если задан такой event
		 * ****************************************************************** */

		// смотрим есть ли скрытые
		// +	показываем последнюю скрытую карту

		if (data.eventName.indexOf('moveEnd') >= 0) {

			console.log('rollerAction:run -> moveEnd');

			if (data.eventData.from.name != deck.name) {
				console.log('rollerAction:run -> moveEnd -> break#');
				return;
			}

			/**
			 * количество открытых видимых карт
			 * @type {number}
			 */
			let unflipCardsCount = deck.cardsCount({
				"visible" : true ,
				"flip"    : false
			});

			/**
			 * количество скрытых карт
			 * @type {number}
			 */
			let hiddenCardsCount = deck.cardsCount({
				"visible" : false
			});

			console.log('rollerAction:run -> moveEnd -> unflip:', unflipCardsCount, 'hidden:', hiddenCardsCount);

			// если нет открытых карт показать предыдущую скрытую
			if (
				unflipCardsCount == 0 &&
				hiddenCardsCount >  0
			) {

				console.log('rollerAction:run -> moveEnd -> 0unplip, +hidden');

				let next = deck.cards.length - hiddenCardsCount;

				deck.showCardByIndex(next, true); // index, redraw

				// save step
				if (_save) {
					console.log('rollerAction:run -> moveEnd -> 0unplip, +hidden -> addStep:show');
					event.dispatch('addStep', {
						"show" : {
							"cardIndex" : next                 ,
							"cardName"  : deck.cards[next].name,
							"deckName"  : deck            .name
						}
					});
				}

				event.dispatch('checkTips');
			}

			// event.dispatch('addStep', {
			// 	"rollerActionEnd" : deck.name
			// });
			console.log('rollerAction:run -> moveEnd -> break#1');
			return;
		}

		/* *********************************************************************
		 * действие совершаемое по прочим event-ам,
		 * всем кроме хода из стопки, предпочтительно клик
		 * ****************************************************************** */

		// как стоит делать
		
		// смотрим есть ли скрытые и открытые карты
		// -	добавляем в историю начало прокрутки
		// смотрим есть ли открытые
		// +	перекладываем справа на лево и кладем в конец скрытых;
		// 		(однако не забываем что работем с одним массивом карт, в который
		// 		входят и открытые и закрытые и скрытые карты и это как-то нужно
		// 		хранить в истории)
		// смотрим есть ли закрытые
		// +	открываем по одной и кладём в конец открытых;
		// -	если нет то показываем и переворачиваем все скрытые
		// 		при этом если за весь цикл прокрутки стопки из неё
		// 		не было взято ни одной карты, вернуть историю на
		// 		начало прокрутки стопки;

		// как делаем

		// смотрим есть ли видимые карты
		// +	смотрим есть ли перевёрнутые карты
		// 		-	просматриваем историю;
		// 		смотрим есть ли скрытые и открытые карты
		// 		-	добавляем в историю начало прокрутки
		// 		смотрим есть ли открытые
		// 		+	скрываем открытые, и записываем это в историю паралельно
		// 			считая сколько карт скрыли;
		// 		смотрим нужно ли по правилам выкладывать на стол больше 1й карты
		// 		+	перекладываем в обратном порядке карты которые выложим
		// 		открываем сколько нужно карт или сколько осталось если осталось
		// 		меньше чем нужно и записываем это в историю;
		// 		опять же если по правилам нужно было положить больше 1й карты
		// 		+	снова ставим скрытые ранее карты в обратном порядке
		// -	смотрим есть ли скрытые карты
		// 		+	показываем все скрытые карты;
		// 			переворачиваем/закрываем все карты;

		// относится ли событие к данной стопке?
		if (data.eventData.to.name != deck.name) {
			console.log('rollerAction:run -> break#2 (eventData.to.name != deck.name)');
			return false;
		}

		/**
		 * количество показываемых карт
		 * например в пасьянке "Косынка" есть два режима игры, по 1 и по 3 карты
		 * @type {number}
		 */
		let openCount = data.actionData.openCount
			? data.actionData.openCount
			: defaultOpenCount;

		/**
		 * количество скрытых карт
		 * @type {number}
		 */
		let hiddenCardsCount = deck.cardsCount({
			"visible" : false
		});

		/**
		 * количество видимых карт
		 * @type {number}
		 */
		let cardsCount = deck.cardsCount({
			"visible" : true
		});

		console.log('rollerAction:run -> openCount:', openCount, 'hidden:', hiddenCardsCount, 'visible:', cardsCount);

		// есть видимые карты
		if (cardsCount > 0) {

			console.groupCollapsed('есть видимые карты');

			/**
			 * количество открытых видимых карт
			 * @type {number}
			 */
			let unflipCardsCount = deck.cardsCount({
				"visible" : true ,
				"flip"    : false
			});

			/**
			 * количество закрытых видимых карт
			 * @type {number}
			 */
			let flipCardsCount = deck.cardsCount({
				"visible" : true,
				"flip"    : true
			});

			console.log('rollerAction:run -> +visible -> v_unflip:', unflipCardsCount, 'v_flip:', flipCardsCount);

			// не осталось видимых закрытых карт (все видимые открыты)

			// ,...,   +-+-+---+
			// :   :   |x|x|x  |
			// :   :   | | |  x|
			// :...:   +-+-+---+ [0 / +]

			if (flipCardsCount == 0) {

				console.groupCollapsed('нет перевёрнутых карт');

				console.log('rollerAction:run -> +visible -> +v_flip');

				/**
				 * количество скрытых карт
				 * @type {number}
				 */
				hiddenCardsCount = deck.cardsCount({
					"visible" : false
				});

				console.log('rollerAction:run -> +visible -> +v_flip -> hidden:', hiddenCardsCount);

				// let rewindStatus = null;

				event.dispatch('rewindHistory', data => {

					console.log('rollerAction:run -> +visible -> +v_flip -> rewindHistory');

					// флаг найденного начала прокрутки колоды
					let found = false;

					let stepsCount = 0;

					// Пробегаем по истории от последнего хода к первому
					for (let i = data.history.length - 1; i >= 0 && !found; i -= 1) {

						stepsCount += 1;

						let step = data.history[i];

						// find action end
						// for (let atomIndex in step) {

						// 	let atom = step[atomIndex];

						// 	if (
						// 		!found                                   &&
						// 		typeof atom.rollerActionEnd == "string"  &&
						// 		       atom.rollerActionEnd == deck.name
						// 	) {
						// 		// break rewind
						// 		return;
						// 	}
						// }

						// пробегаемся по атомарным составным хода из истории
						for (let atomIndex in step) {

							let atom = step[atomIndex];

							// rewind
							// просматриваемый ход содержит флаг начала игры
							if (
								!found                                     &&
								typeof atom.rollerActionStart == "string"  &&
								       atom.rollerActionStart == deck.name
							) {

								found = true;

								event.dispatch('resetHistory');

								for (let i = 0; i < stepsCount; i += 1) {
									data.undo();
								}

								// reset deck
								deck.showCards   (false); // no redraw, not add in history
								deck.flipAllCards(false); // no redraw, not add in history

								// rewindStatus = 'done';

							// reset
							// если ход в истории найден раньше начала прокруток остановить rewind
							} else if (
								!found    &&
								atom.move
							) {
								// всё ещё не нашли начало прокрутки колоды
								// текущая атомарная составляющая хода содержит перемещение карт

								// Swap
								for (let i = 0; i < ((unflipCardsCount / 2) | 0); i += 1) {

									let next = unflipCardsCount - i - 1;

									if (i < next) {
										Atom.swap(deck, i, next, _save); // deck, fromIndex, toIndex, save
									}
								}

								// Hide visible flipped cards
								for (let i = 0; i < unflipCardsCount; i += 1) {

									deck.hideCardByIndex(i, true); // index, redraw

									// save step
									if (_save) {
										event.dispatch('addStep', {
											"hide" : {
												"cardIndex" : i                 ,
												"cardName"  : deck.cards[i].name,
												"deckName"  : deck         .name
											}
										});
									}
								}

								found = true;

								// reset deck
								deck.showCards   (false, _save); // no redraw, add in history
								deck.flipAllCards(false, _save); // no redraw, add in history

								deck.Redraw();

								if (_save) {
									event.dispatch('saveSteps');
								}

								// rewindStatus = 'break';
								// выходим из rewindHistory т.к. из стопки брали карты
								break;
							}
						}
					}
				});

				// Restore deck

				// количество скрытых карт
				hiddenCardsCount = deck.cardsCount({
					"visible" : false
				});

				// ещё есть скрытые карты
				if (hiddenCardsCount > 0) {

					// console.log('ещё есть скрытые карты', hiddenCardsCount, );

					deck.showCards   (false, _save); // no redraw, add to history
					deck.flipAllCards(false, _save); // no redraw, add to history

					// event.dispatch('saveSteps');

					// this.run(deck, data);

					deck.Redraw();
				}

				// return;
				console.groupEnd();
			}

			// первая прокрутка

			// +---+   ,...,    
			// |///|   :   :    
			// |///|   :   :    
			// +---+   :...:     [0]

			if (
				hiddenCardsCount == 0 && // нет скрытых карт
				unflipCardsCount == 0    // нет открытых видимых карт
			) {
				if (_save) {
					event.dispatch('addStep', {
						"rollerActionStart" : deck.name
					});
				}
			}

			/**
			 * количество скрываемых открытых карт
			 * @type {number}
			 */
			let unflippedCount = 0;

			// скрываем открытые видимые карты (если есть)
			if (unflipCardsCount > 0) {

				// +---+   +-+-+---+
				// |///|   |x|x|x  |
				// |///|   | | |  x|
				// +---+   +-+-+---+ -> [...]

				console.log('rollerAction:run -> +visible -> +v_unflip');

				let cards = deck.getCards();

				for (let i in cards) {

					if (cards[i].flip == false) {

						unflippedCount += 1;

						deck.hideCardByIndex(i);

						if (_save) {
							console.log('rollerAction:run -> +visible -> +v_unflip -> addStep:hide');
							event.dispatch('addStep', {
								"hide" : {
									"cardIndex" : i                 ,
									"cardName"  : deck.cards[i].name,
									"deckName"  : deck         .name
								}
							});
						}
					}
				}
			}

			// далее карты выкладываются в обратном порядке
			// если выкладываем больше одной карты
			// поэтому возвращаем выложенные на предыдущей итерации карты в исходное положение
			if (openCount > 1) {

				console.log('rollerAction:run -> +visible -> +openCount');

				for (let i = cardsCount - unflippedCount; i < cardsCount; i += 1) {

					let next = cardsCount * 2 - i - unflippedCount - 1; // TODO что тут происходит? почему * 2

					console.log('rollerAction:run -> +visible -> +v_unflip -> +openCount -> swap#1:', i, next, i < next);

					if (i < next) {
						Atom.swap(deck, i, next, _save);
					}
				}
			}

			// количество открытых дальше карт (карт в стопке могло остаться меньше трёх)
			unflippedCount = 0;

			// открываем следующие openCount|3 карт
			for (
				let i  =           flipCardsCount - 1        ;
				    i >= 0 && i >= flipCardsCount - openCount;
				    i -= 1
			) {

				unflippedCount += 1;

				deck.cards[i].flip = false;

				if (_save) {
					event.dispatch('addStep', {
						"unflip" : {
							"cardIndex" : i                 ,
							"cardName"  : deck.cards[i].name,
							"deckName"  : deck.name
						}
					});
				}
			}

			/**
			 * количество видимых карт
			 * @type {number}
			 */
			cardsCount = deck.cardsCount({
				"visible" : true
			});

			// карты выкладываются в обратном порядке
			if (
				openCount > 1// &&
				// unflippedCount
			) {

				for (let i = cardsCount - unflippedCount; i < cardsCount; i += 1) {

					let next = cardsCount * 2 - i - unflippedCount - 1;

					if (i < next) {
						Atom.swap(deck, i, next, _save);
					}
				}
			}

			if (_save) {
				event.dispatch('saveSteps');
			}

		// нет видимых карт
		} else {

			// console.log('нет видимых карт');

			// Restore deck

			// количество скрытых карт
			hiddenCardsCount = deck.cardsCount({
				"visible" : false
			});

			// есть скрытые карты
			if (hiddenCardsCount > 0) {

				// показываем все скрытые карты
				deck.showCards   (false, _save); // no redraw, save
				
				// переворачиваем/закрываем все карты
				deck.flipAllCards(false, _save); // no redraw, save

				// event.dispatch('saveSteps');

				deck.Redraw();

				this.run(deck, data);

				return;
			}
		}

		deck.Redraw();

		super.end();

		event.dispatch('checkTips');
	}
}

export default new rollerAction();