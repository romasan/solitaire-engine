'use strict';

import event	from 'event';
import share	from 'share';
import common	from 'common';
import defaults from 'defaults';

import elRender from 'elRender';

let angleValidate = (_angle) => {

	if(_angle < 0  ) { _angle += 360; }
	if(_angle > 360) { _angle -= 360; }

	return _angle;
};

event.listen('moveDragDeck', (data) => {

	common.curLock();

	let _lastIndex = data.moveDeck.length - 1;

	for(let i in data.moveDeck) {

		let _position = data.destination.padding(data.destination.cards.length - 1 + (i | 0));

		let departureAngle   = angleValidate(data.departure	.rotate), 
		    destinationAngle = angleValidate(data.destination.rotate);

		let _cardDomElement = share.get('domElement:' + data.moveDeck[i].card.id);

		elRender(_cardDomElement)
			.css({
				'transform' : 'rotate(' + departureAngle + 'deg)'
			})

		if(departureAngle - destinationAngle > 180) {
			
			departureAngle = departureAngle - 360;
			elRender(_cardDomElement)
				.css({
					'transform' : 'rotate(' + departureAngle + 'deg)'
				})
		};
		
		if(departureAngle - destinationAngle < -180) {
			destinationAngle -= 360;
		}

		let _params = {
			'transform' : 'rotate(' + destinationAngle + 'deg)',
			'left'      : _position.x + 'px'                   ,
			'top'       : _position.y + 'px'
		};

		let _zIndex = (defaults.topZIndex | 0) + (i | 0);

		let _callback = function(data, _last) {

			data.departure	.Redraw();
			data.destination.Redraw();

			common.curUnLock();

			if(_last && typeof data.callback == "function") {
				data.callback();
			}

			event.dispatch('moveDragDeckDone', {
				deck : data.destination
			});
		}.bind(null, data, i == _lastIndex);

		elRender(_cardDomElement)
			.css({
				'z-index' : _zIndex
			})
			.animate(
				_params  ,
				_callback
			);
	}
});

// --------------------------------------------------------------------------------------------------------

event.listen('moveDragDeckDone', (data) => {

	if(!data.deck.fill) {
		return;
	}

	let _deck = data.deck.cards;
	
	for(let i in _deck) {

		let _cardDomElement = share.get('domElement:' + _deck[i].id);

		elRender(_cardDomElement)
			.addClass('fill')
	}
});

// --------------------------------------------------------------------------------------------------------

event.listen('dragDeck', (data) => {// {x, y, _dragDeck, _startCursor, _deck}

	for(let i in data._dragDeck) {
			let _position = data._deck.padding(data._dragDeck[i].index);
			let _params = {
				'left'    : (_position.x + (data.x - data._startCursor.x)) + 'px',
				'top'     : (_position.y + (data.y - data._startCursor.y)) + 'px',
				'z-index' : defaults.topZIndex + (i | 0)
			}

			// Operations with DOM
			let _cardDomElement = share.get('domElement:' + data._dragDeck[i].card.id);

			elRender(_cardDomElement)
					.css(_params);	 
		}
});