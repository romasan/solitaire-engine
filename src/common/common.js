'use strict';

import share    from 'share';
import event    from 'event';
import defaults from 'defaults';

import Tips     from 'tips';
import Field    from 'field';

// event.listen('makeStep', function(e) {
// 	// ???
// 	share.saveStepCallback(e);
	
// 	share.set('oneStepWay', {});
// });

// event.listen('win', function(e) {
// 	if(e && e.show) {
// 		//  ????
// 		share.winCheckCallback(e);
// 	}
// });
// event.listen('newGame', function(e) {
// 	Tips.checkTips();
// });

// Lock/Unlock

var _lock = false;

var isLock = function() {
	return _lock;
};
var lock = function() {
	_lock = true;
}
event.listen('lock', lock);

var unlock = function() {
	lock = false;
}
event.listen('unlock', unlock);

var isCurLock = function() {
	return share.get('curLockState');
};

var curLock = function() {
	console.log('curLock');
	share.set('curLockState', true);
}
var curUnLock = function() {
	console.log('curUnLock');
	share.set('curLockState', false);
}

// getters

var getElements = function() {
	return share.get('elements');
}

var getElementById = function(a) {
	var _elements = share.get('elements');
	return _elements[a];
}

var getElementsByName = function(name, type) {
	var response = [];
	var _elements = share.get('elements');
	for(var i in _elements) {
		if(_elements[i].name && typeof _elements[i].name == 'string' && _elements[i].name == name) {
			if(type && typeof _elements[i].type == 'string') {
				if(type && _elements[i].type == type) {
					response.push(_elements[i]);
				} else {
					response.push(_elements[i]);
				}
			} else {
				response.push(_elements[i]);
			}
		}
	}
	return response;
};

// validator

var validateCardName = function(name, nolog) {
	
	if(typeof name != 'string') {
		console.warn('Warning: validate name must have string type', name);
		// throw new Error('z');
		return false;
	}
	
	var suit  = name.slice(0, 1),
		rank  = name.slice(1, 3),
		color = null,
		value = defaults.card.values[defaults.card.ranks.indexOf(rank)];
	for(var colorName in defaults.card.colors) {
		if(defaults.card.colors[colorName].indexOf(suit) >= 0) {
			color = colorName;
		}
	}
	
	if( 
		defaults.card.suits.indexOf(suit) >= 0
	 && defaults.card.ranks.indexOf(rank) >= 0
	) {
		return {
			suit  : suit, 
			rank  : rank,
			color : color,
			value : value
		}
	} else {
		console.warn('Warning: validate name:', name, '- incorrect');
		// throw new Error();
		return false;
	}
};

// ID generator

var _id = 0,
	genId = function() {
	return _id++;
};

share.set('animation', defaults.animation);

var animationOn = function() {
	share.set('animation', true);
}

var animationOff = function() {
	share.set('animation', false);
}

event.listen('newGame', function(e) {
	animationOff();
});

event.listen('historyReapeater', function(e) {
	if(e) {
		share.set('noRedraw', true);

		share.set('noTips', true);
	} else {
		share.set('noRedraw', false);
		var _field = Field();
		_field.Redraw();

		share.set('noTips', false);
		Tips.checkTips();

		console.log('historyReapeater: Off');
	}
});

// event.listen('makeStep', function(e) {
	// share.set('animation', defaults.animation);
// });

export default {
	isLock           ,
	lock             ,
	unlock           ,
	isCurLock        ,
	curLock          ,
	curUnLock        ,
	getElements      ,
	getElementById   ,
	getElementsByName,
	validateCardName ,
	genId            ,
	animationOn      ,
	animationOff
};