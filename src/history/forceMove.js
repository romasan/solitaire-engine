'use strict';

import event  from 'event';
import share  from 'share';
import common from 'common';

import Deck   from 'addDeck';
import Tips   from 'tips';

export default function(a) {

	var _animation = share.get('animation');

	if(!a.from || !a.to || !a.deck) {
		return;
	}

	if(!a.deck.length) return;
	
	var _from = typeof a.from == "string"
		? Deck.Deck(a.from)
		: a.from;
	var _to   = typeof a.to   == "string"
		? Deck.Deck(a.to)
		: a.to;


	if(!_from || !_to || _from.type != "deck" || _to.type != "deck") {
		return;
	}

	// console.log('FORCEMOVE from:', _from.name, 'to:', _to.name, a.deck);
	
	var _check     = true;
	var _from_deck = _from.cards;
	

	for(var i in _from_deck) {
		
		if(i >= _from_deck.length - a.deck.length) {
			var _id = i - (_from_deck.length|0) + (a.deck.length|0);
			if(a.deck[_id] && _from_deck[i].name != a.deck[_id]) {
				_check = false;
			}
		}
	}

	if(_check) {

		var _pop = _from.Pop(a.deck.length);

		if(a.flip) {
			for(var i in _pop) {
				_pop[i].flip = !_pop[i].flip;
			}
		}

		_to.Push(_pop);

		if(_animation) {

			var __pop = [];
			for(var i in _pop) {
				__pop.push({
					card : _pop[i]
				});
			}

			event.dispatch('moveDragDeck', {
				departure   : _from,
				destination : _to,
				moveDeck    : __pop,
				// callback : function() {}
			});
			
		} else {
			_from.Redraw();
			_to  .Redraw();
		}

	} else {
		// _warn(4);
		console.log("_warn(4)");
	}

};