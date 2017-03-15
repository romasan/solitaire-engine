'use strict';

import event         from 'event'        ;
import share         from 'share'        ;
import defaults      from 'defaults'     ;
import common        from 'common'       ;

import flipTypes     from 'flipTypes'    ;
import putRules      from 'putRules'     ;
import takeRules     from 'takeRules'    ;
import fullRules     from 'fullRules'    ;
import paddingTypes  from 'paddingTypes' ;
import deckActions   from 'deckActions'  ;
import Take          from 'deckTake'     ;
import Put           from 'deckPut'      ;
import genCardByName from 'genCardByName';
import Group         from 'group'        ;

import getDecks      from 'getDecks'     ;
import getDeckById   from 'getDeckById'  ;
import deckCardNames from 'deckCardNames';
import getDeck       from 'getDeck'      ;

/*
 * Redraw
 * getTopCard
 * lock
 * unlock
 * flipCheck
 * unflipTopCard
 * flipAllCards
 * unflipAllCards
 * checkFull
 * Fill
 * clear
 * Push
 * Pop
 * Take
 * Put
 * genCardByName
 * hide
 * show
 * hideCards
 * hideCardByIndex
 * showCards
 * getCardsNames
 * getCards
 * cardsCount
 * getCardByIndex
 * getRelationsByName
 * hasTag
 */

class Deck {

	constructor(data, id) {

		if(!data) {
			return false;
		}

		this.cards = [];

		// parameters
		this.type = 'deck';
		this.full = false;

		this.id = id;

		let _parent_el   = Group.getByName(data.parent)                  ,
		    _parent_name = _parent_el ? _parent_el.name : 'no_parent_'   ,
		    _new_id      = _parent_el ? _parent_el.getDecks().length : id;

		this.name = typeof data.name == 'string' 
			? data.name
			: (_parent_name + '_' + _new_id);

		this.locked    =        data.locked                 ? true           : false            ;
		this.save      =        data.save                   ? true           : false            ;
		this.visible   = typeof data.visible   == 'boolean' ? data.visible   : true             ;
		this.deckIndex = typeof data.deckIndex == 'number'  ? data.deckIndex : null             ;
		this.parent    = typeof data.parent    == 'string'  ? data.parent    : 'field'          ;
		this.autoHide  = typeof data.autoHide  == 'boolean' ? data.autoHide  : defaults.autohide;

		this.data = {};

		// changed parameters
		if(typeof data.showSlot == 'undefined') {
			data.showSlot = defaults.showSlot;
		}

		if(data.padding) {
			if(
				typeof data.padding.x == 'number' &&
				typeof data.paddingX  != 'number'
			) {
				data.paddingX = data.padding.x;
			}
			if(
				typeof data.padding.y == 'number' &&
				typeof data.paddingY  != 'number'
			) {
				data.paddingY = data.padding.y;
			}
		}

		if(data.flipPadding) {
			if(
				typeof data.flipPadding.x == 'number' &&
				typeof data.flipPaddingX  != 'number'
			) {
				data.flipPaddingX = data.flipPadding.x;
			}
			if(
				typeof data.flipPadding.y == 'number' &&
				typeof data.flipPaddingY  != 'number'
			) {
				data.flipPaddingY = data.flipPadding.y;
			}
		}

		this._params = {
			"padding_y"      : typeof data.paddingY     == 'number' ? data.paddingY     : defaults.padding_y     ,
			"flip_padding_y" : typeof data.flipPaddingY == 'number' ? data.flipPaddingY : defaults.flip_padding_y,
			"padding_x"      : typeof data.paddingX     == 'number' ? data.paddingX     : defaults.padding_x     ,
			"flip_padding_x" : typeof data.flipPaddingX == 'number' ? data.flipPaddingX : defaults.flip_padding_x,
			"startZIndex"    : typeof data.startZIndex  == 'number' ? data.startZIndex  : defaults.startZIndex   ,
			"rotate"         : typeof data.rotate       == 'number' ? data.rotate       : defaults.rotate        ,
			"x"              : 0                                                                                 ,
			"y"              : 0
		};

		this.rotate = this._params.rotate;

		this.autoUnflipTop = typeof data.autoUnflipTop == 'boolean' ? data.autoUnflipTop : defaults.autoUnflipTop;

		// Flip
		let flipData = null;
		let flipType = data.flip && typeof data.flip == 'string' 
			? data.flip.indexOf(':') >= 0
				? (e => {

					let name = e[0];

					if(e.length == 2) {
						flipData = e[1];
					}

					return flipTypes[name]
						? name
						: defaults.flip_type;
				})(data.flip.split(':'))
				: flipTypes[data.flip]
					? data.flip
					: defaults.flip_type
			: defaults.flip_type;

		this.cardFlipCheck = (card, i, length) => {
			card.flip = flipTypes[flipType](i, length, flipData);
		};

		// Put
		this.putRules = data.putRules
			? typeof data.putRules == 'string'
				? putRules[data.putRules]
					? [data.putRules]
					: defaults.putRules
				: data.putRules.constructor == Array
					? data.putRules.filter(
						ruleName => typeof ruleName == 'string' && putRules[ruleName] // TODO Exception (putRule "***" not found)
							? true
							: false
					)
					: defaults.putRules
			: defaults.putRules;

		if(this.putRules.length == 0) {
			this.putRules = defaults.putRules;
		}

		// Take
		// можно ли взять карту/стопку
		this.takeRules = data.takeRules
			? typeof data.takeRules == 'string'
				? takeRules[data.takeRules]
					? [data.takeRules]
					: defaults.takeRules
				: data.takeRules.constructor == Array
					? data.takeRules.filter(
						ruleName => typeof ruleName == 'string' && takeRules[ruleName] // TODO Exception (putRule "***" not found)
					)
					: defaults.takeRules
			: defaults.takeRules;

		// Full
		// Правила сложенной колоды
		// Сложенная колода может использоваться для определения выиигрыша
		// В сложенную колоду нельзя класть новые карты
		this.fullRules = data.fullRules
			? typeof data.fullRules == "string"
				? fullRules[data.fullRules]
					? [data.fullRules]
					: defaults.fullRules
				: data.putRules.constructor == Array
					? data.fullRules.filter(
						ruleName => typeof ruleName == "string" && fullRules[ruleName]
					)
					: defaults.fullRules
			: defaults.fullRules;

		// Padding
		// порядок карт в колоде
		let paddingData = null;
		let padding = data.paddingType                                 // isset data.paddingType
			? typeof data.paddingType == 'string'                      // is string
				? paddingTypes[data.paddingType]                       // isset method
					? paddingTypes[data.paddingType]                   // use method(data.paddingType)
					: data.paddingType.indexOf(':') >= 0               // is method with attribute
						? (e => {

							let name = e[0];                           // method name

							if(paddingTypes[name]) {
								paddingData = e[1];                    // save method data
								return paddingTypes[name];             // use method(data.paddingType:)(:data.paddingType)
							}

							return paddingTypes[defaults.paddingType]; // use default
						})(data.paddingType.split(':'))
						: paddingTypes[defaults.paddingType]           // use default
				: paddingTypes[defaults.paddingType]                   // use default
			: paddingTypes[defaults.paddingType];                      // use default

		this.padding = index => {

			let _cards = this.getCards();
			let _index = index < _cards.length ? index : _cards.length - 1;
			let _card = _cards[_index] ? _cards[_index] : this.cards[index];

			return padding(
				this._params  ,
				_card,
				_index        ,
				_cards.length ,
				_cards        ,
				paddingData
			);

			// return padding(
			// 	this._params     ,
			// 	this.cards[index], // this.getCardByIndex(index);
			// 	index            ,
			// 	this.cards.length, // this.cardsCount({"visible" : true})
			// 	this.cards       , // this.getCards({"visible" : true})
			// 	paddingData
			// );
		}

		this.actions = [];
		if(data.actions) {
			this.actions = data.actions;
			deckActions.add(this);
		}

		// Relations
		if(data.relations) {
			this.relations = data.relations;
		} else {
			this.relations = [];
		}

		// Tags
		this.tags = data.tags ? data.tags : [];

		event.dispatch('addDeckEl', {
			"deckData" : data        , 
			"deck"     : this        ,
			"params"   : this._params
		});

		// Подписывается на перетаскивание стопки/карты
		let _callback = data => {

			// TODO
			// проверять fill только для тех стопок котрые участвовали в Action

			if(data.destination.name != this.name) {
				return;
			}

			this.checkFull();
		};

		event.listen('moveDragDeck', _callback);
	}

	// перерисовка стопки
	Redraw(data) {

		event.dispatch('redrawDeck', {
			"deck"     : this        ,
			"deckData" : data        ,
			"params"   : this._params,
			"cards"    : this.cards
		});

		event.dispatch('redrawDeckFlip', {
			"cards" : this.cards
		});

	}

	getTopCard() {

		if(this.cards.length == 0) {
			return false;
		}

		return this.cards[this.cards.length - 1];
	}

	getSomeCards(count) {

		let _cards = [];

		if(
			typeof count != 'number'  ||
			count > this.cards.length ||
			count < 1
		) {
			count = this.cards.length
		}

		for(let i = 0; i < count; i += 1) {
			_cards.push(this.cards[this.cards.length - 1 - i]);
		}

		return _cards;
	}

	lock() {
		this.locked = true;
	}

	unlock() {
		this.locked = false;
	}

	flipCheck() {

		for(let cardIndex in this.cards) {
			this.cardFlipCheck(this.cards[cardIndex], cardIndex | 0, this.cards.length, this.cards[this.cards.length - 1].name);
		}

		event.dispatch('redrawDeckFlip', this);
	}

	unflipCardByIndex(index) {

		if(this.cards[index]) {

			this.cards[index].flip = false;

			// event.dispatch('redrawDeckFlip', this);
			this.Redraw();

			event.dispatch('addStep', {
				"unflip" : {
					"deckName"  : this.name             ,
					"cardIndex" : index                 ,
					"cardName"  : this.cards[index].name
				}
			});
		}
	}

	unflipTopCard() {

		if(this.cards.length > 0) {
			this.unflipCardByIndex(this.cards.length - 1);
		}
	}

	flipAllCards(redraw = true) {

		for(let i in this.cards) {
			this.cards[i].flip = true;
		}

		if(redraw) {
			this.Redraw();
		}
	}

	unflipAllCards(redraw = true) {

		for(let i in this.cards) {
			this.cards[i].flip = false;
		}

		if(redraw) {
			this.Redraw();
		}
	}

	checkFull() {

		if(
			!this.full                &&
			this.fullRules            &&
			this.fullRules.length > 0
		) {

			let full = true;

			for(let ruleIndex in this.fullRules) {

				let _rule = this.fullRules[ruleIndex];

				if(
					typeof _rule == 'string'
				) {
					full = full                                  &&
					       typeof fullRules[_rule] == 'function' &&
					       fullRules[_rule](this);
				} else {

					for(let subRule in _rule) {
						if(
							typeof subRule            == 'string'   &&
							typeof fullRules[subRule] == 'function'
						) {
							full = full && fullRules[subRule](this, _rule[subRule]);
						}
					}

					// if(_rule.query) {
					// 	fullRules._query(this, _rule.query)
					// }
				}
			}

			this.full = full;
		}

		return this.full;
	}

	Fill(cardNames) {

		for(let i in cardNames) {
			this.genCardByName(cardNames[i]);
		}
	}

	clear() {

		for(let i in this.cards) {
			event.dispatch('removeEl', this.cards[i]);
			this.cards[i] = null;
		}

		this.cards = [];

		event.dispatch('removeEl', this);
	}

	Push(deck) {

		for(let i in deck) {
			deck[i].parent = this.id;
			this.cards.push(deck[i]);
		}
	}

	Pop(count, clearParent) {

		if(this.cards.length < count) {
			return false;
		}

		let _deck = [];

		for(;count;count -= 1) {

			let _pop = this.cards.pop();

			if(clearParent) {
				_pop.parent = null;
			}

			_deck.push(_pop);
			_deck[_deck.length - 1].parent = null;
		}

		_deck.reverse();

		// что делать если вынули все карты
		if(
			this.autoHide           && 
			this.cards.length == 0
		) {
			this.hide();
		}

		this.Redraw();

		return _deck;
	}

	Take(cardId) {
		return Take(this, cardId);
	}

	// проверяем, можем ли положить стопку/карту
	// возвращает true, если согласно правилам сюда можно положить карту
	Put(putDeck) {
		return Put(this, putDeck);
	}

	// создать карту
	genCardByName(name) {
		return genCardByName(this, name);
	}

	hide() {
		this.visible = false;
		event.dispatch('addStep', { "hideDeck" : this.name });
		this.Redraw();
	}

	show() {
		this.visible = false;
		event.dispatch('addStep', { "showDeck" : this.name });
		this.Redraw();
	}

	// getCardsByName(cardName) {
	// 	var _cards = [];
	// 	for(var i in this.cards) {
	// 		if(this.cards[i].name == cardName) {
	// 			_cards.push(this.cards[i]);
	// 		}
	// 	}
	// 	return _cards;
	// }

	// Card(cardName) {
	// 	return this.getCardsByName(cardName)[0];
	// }

	hideCards(redraw = true) {

		for(let i in this.cards) {
			this.cards[i].visible = false;
			// event.dispatch('hideCard', this.cards[i]);
		}

		if(redraw) {
			this.Redraw();
		}
	}

	hideCardByIndex(index, redraw) {
		if(this.cards[index]) {

			this.cards[index].visible = false;

			if(redraw) {
				this.Redraw();
			}
		}
	}

	showCards(redraw = true) {

		for(let i in this.cards) {
			this.cards[i].visible = true;
			// event.dispatch('showCard', this.cards[i]);
		}

		if(redraw) {
			this.Redraw();
		}
	}

	getCardsNames() {

		let _cardsNames = [];

		for(let i in this.cards) {
			_cardsNames.push(this.cards[i].name);
		}

		return _cardsNames;
	}

	getCards(filters = {"visible" : true}) {
		if(filters) {
			let _cards = [];
			for(let i in this.cards) {

				let _correct = true;

				for(let filterName in filters) {
					_correct = _correct && this.cards[i][filterName] == filters[filterName];
				}

				if(_correct) {
					_cards.push(this.cards[i]);
				}
			}
			return _cards;
		} else {
			return this.cards;
		}
	}

	cardsCount(filters) {
		return this.getCards(filters).length;
	}

	getCardByIndex(index) {
		return this.cards[index] ? this.cards[index] : false;
	}

	getRelationsByName(relationName, filters) {

		let _relations = [];

		for(let i in this.relations) {
			if(this.relations[i].name == relationName) {

				if(filters) {

					let _correct = true;

					for(let attr in filters) {
						_correct = _correct && this.relations[i][attr] == filters[attr];
					}

					if(_correct) {
						_relations.push(this.relations[i]);
					}
				} else {
					_relations.push(this.relations[i]);
				}
			}
		}

		return _relations;
	}

	hasTag(tagName) {

		for(let i in this.tags) {
			if(this.tags[i] == tagName) {
				return true;
			}
		}

		return false;
	}
}

// add deck

let addDeck = data => {

	if(!data) {
		return false;
	}

	let id = 'deck_' + common.genId();

	let _deck = new Deck(data, id);

	// fill deck
	if(data.fill) {
		for(let i in data.fill) {
			if(typeof data.fill[i] == 'string') {
				_deck.genCardByName(data.fill[i]);
			}
		}
	}

	let _elements = share.get('elements');

	_elements[id] = _deck;

	share.set('elements', _elements);

	return _deck;
};

export default {
	deckCardNames,
	addDeck      ,
	getDeck      ,
	getDecks     ,
	getDeckById
};
