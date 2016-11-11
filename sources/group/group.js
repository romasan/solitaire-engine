'use strict';

import event          from 'event';
import share          from 'share';
import defaults       from 'defaults';
import common         from 'common';

import Deck           from 'deck';
import groupFill      from 'groupFill';
import groupRedraw    from 'groupRedraw';
import groupGenerator from 'groupGenerator';

const params = {
	"paddingType"  : {type : "any"}                    ,
	"flip"         : {type : "any"}                    ,
	"showSlot"     : {type : "any"}                    ,
	"takeRules"    : {type : "any"}                    ,
	"putRules"     : {type : "any"}                    ,
	"fillRule"     : {type : "any"}                    ,
	"autoHide"     : {type : "any"}                    ,
	"paddingX"     : {type : "any"}                    ,
	"paddingY"     : {type : "any"}                    ,
	"flipPaddingX" : {type : "any"}                    ,
	"flipPaddingY" : {type : "any"}                    ,
	"actions"      : {type : "any"}                    ,
	"save"         : {type : "boolean", default : true}
	// "longStep"     : {type : "boolean", default : false}
};

class groupClass {
	
	constructor(data, _id) {
		
		this.type = 'group';
		
		this.id = _id

		this.name = data.name && typeof data.name == 'string' 
			? data.name 
			: ('name_' + _id);
		
		this.position = {
			x : data.position && data.position.x && typeof data.position.x == 'number' 
				? data.position.x 
				: 0,
			y : data.position && data.position.y && typeof data.position.y == 'number' 
				? data.position.y 
				: 0,
		};

		this.placement = data.placement 
			? {
				x : data.placement.x 
					? data.placement.x 
					: 0, 
				y : data.placement.y 
					? data.placement.y 
					: 0
			} 
			: null

		this.decks = {};
		
		// сохраняем атрибуты чтобы прокинуть их колодам
		this.parameters = {};
		for(let paramName in params) {
			if(params[paramName].type == "any") {
				this.parameters[paramName] = data[paramName] ? data[paramName] : defaults[paramName];
			} else if(params[paramName].type == "boolean") {
				this.parameters[paramName] = typeof data[paramName] == "boolean" ? data[paramName] : params[paramName].default;
				// this.parameters[paramName] = typeof data[paramName] == "boolean" ? data[paramName] : defaults[paramName];
			}
		};
		
		this.deckIndex = [];

	}

// --------------------------------------------------------------------

	// Add deck to group
	addDeck(data) {

		if(!data) {
			return;
		}
		
		if(!data.position) {
			data.position = {
				'x' : 0, 
				'y' : 0
			};
		}

		// сортировка элементов в группе по заданному индексу и порядку добавления
		
		// if(!data.position.x) { data.position.x = 0; }
		// if(!data.position.y) { data.position.y = 0; }

		if(!data.parent) {
			data.parent = this.name;
		}
		
		data.parentPosition = {
			x : this.position.x, 
			y : this.position.y
		};
		
		// расставляем колоды в группе
		// 1 приоретет отдаётся параметру groupIndex
		// остальные вставляются в промежутки или добавляются в конец
		let _index = 0;
		
		if(
			data.groupIndex                                                                 &&
			decks[ this.deckIndex[data.groupIndex - 1] ].this.deckIndex == data.this.deckIndex &&
			typeof data.groupIndex == 'number'                                              &&
			this.deckIndex[data.groupIndex - 1]
		) {
			console.warn('Warning: duplicate groupIndex', data.groupIndex, 'changed to null');
			data.groupIndex = null;
		}

		if(data.groupIndex && typeof data.groupIndex == 'number') {

			if(this.deckIndex[data.groupIndex - 1]) {
				
				for(;typeof this.deckIndex[_index] != 'undefined';_index += 1) {}
				
				if(placement) {
					
					let _index    = this.deckIndex[data.groupIndex - 1];
					let _elements = share.get('elements');
					
					if(placement.x) {
						_elements[_index].x( this.position.x + (placement.x + defaults.card.width) * _index );
					}
					
					if(placement.y) {
						_elements[_index].y( this.position.y + (placement.y + defaults.card.width) * _index );
					}
					
					share.set('elements', _elements);
				}

				this.deckIndex[_index] = this.deckIndex[data.groupIndex - 1];
				this.deckIndex[data.groupIndex - 1] = true;
				_index = data.groupIndex - 1
			} else {
				
				this.deckIndex[data.groupIndex - 1] = true;
				_index = data.groupIndex - 1
			}

		} else {
			for(;typeof this.deckIndex[_index] != 'undefined';_index += 1) {};
			this.deckIndex[_index] = true;
		}
		
		// смещаем координаты колод относиткльно координад группы
		if(this.placement) {


			if(this.placement.x) {
				data.position.x = (this.placement.x + defaults.card.width)  * (_index);
			}
			
			if(this.placement.y) {
				data.position.y = (this.placement.y + defaults.card.height) * (_index);
			}
		}

		// прокидываем некоторые атрибуты всем колодам группы (у атрибутов заданных колоде приоритет выше)
		for(let paramName in params) {
			
			if(params[paramName].type == "any") {
				if(
					this.parameters[paramName]        &&
					typeof data[paramName] == "undefined"
				) {
					data[paramName] = this.parameters[paramName];
				};
			} else if(params[paramName].type == "boolean") {
				// if(
				//	typeof this.parameters[paramName] != "undefined" &&
				//	typeof data[paramName] == "undefined"
				// ) {
				data[paramName] = this.parameters[paramName];
				// }			
			}
		};

		let _el = Deck.addDeck(data);
		
		this.deckIndex[_index]  = _el.id;
		this.decks[_el.id] = _el;
	}

	// Fill group
	Fill(cardNames) {
		groupFill.call(this, cardNames);
	}

	getDeckById(id) {
		return this.decks[id];
	}

	getDecksByName(name) {
		
		let _decks = {};
		
		for(let d in this.decks) {
			if(this.decks[d].name == name) {
				_decks[d] = decks[d];
			}
		}
		
		return _decks;
	}

	// Get decks from group
	getDecks(data) {
		
		let _decks = [];
		
		for(let i in this.decks) {
			if(data && data.visible) {
				if(this.decks[i].visible) {
					_decks.push(this.decks[i]);
				}
			} else {
				_decks.push(this.decks[i]);
			}
		}
		
		return _decks;
	}

	// Redraw group
	Redraw(_a) {
		groupRedraw(this, _a);
	}

	hasDeck(deckName) {
		
		let has = false;
		
		for(let deckId in decks) {
			if(decks[deckId].name == deckName) {
				has = true;
			}
		}
		
		return has;
	}

}

// -----------------------------------------------------------------------------------------------------------------------

let add = function(data) {

	if(!data) {
		return false;
	}

	let _id = 'group_' + common.genId();

	let _el_group = new groupClass(data, _id);

	if(data.decks) {

		if(typeof data.decks == 'number') {
			data.decks = {
				"generator" : {
					"type"  : "count",
					"count" : data.decks
				}
			};
		};

		if(data.decks.generator) {

			if(data.decks.generator.type) {

				if(groupGenerator[data.decks.generator.type]) {

					data.decks = groupGenerator[data.decks.generator.type].call(_el_group, data.decks.generator);
				} else {
					console.warn('Deck generator type "' + data.decks.generator.type + '" not found.');
					return;
				}
			} else {
				console.warn('Deck generator type is null.');
				return;
			};

			data.placement = null;

		};

		// relations TO <-> FROM
		// if( data.backRelations ) TODO
		for(let to in data.decks) {

			for(let relId in data.decks[to].relations) {

				let _relation = null;
				try {
					_relation = Object.assign({}, data.decks[to].relations[relId]);
				} catch(e) {
					_relation = data.decks[to].relations[relId];
				}

				for(let from in data.decks) {
					
					if(data.decks[from].name == _relation.to) {
						_relation.to = null;
						_relation.from = data.decks[to].name;
						data.decks[from].relations.push(_relation)
					}
				}
			}
		}

		for(let d in data.decks) {
			_el_group.addDeck(data.decks[d]);
		};
	};

	let _elements = share.get('elements');
	_elements[_id] = _el_group;
	share.set('elements', _elements);
	
	// fill group
	if(data && data.fill) {

		let _checkFillDeck = data.fill.length;
		if(_checkFillDeck) {
			_el_group.Fill(data.fill);
		}
	}

	return _el_group;
};

let getGroup = function(name) {
	return common.getElementsByName(name, 'group')[0];
};
	
export default {
	add,
	getGroup
};