'use strict';

import share    from 'share';
import event    from 'event';
import defaults from 'defaults';
import common   from 'common';

import Field    from 'field';
import elRender from 'elRender';

event.listen('addCardEl', (data) => {
	
	let _card = {
		width  : defaults.card.width .toFixed(3) * 1,
		height : defaults.card.height.toFixed(3) * 1
	};

	let _params = {
		"width"  : _card.width  + 'px',
		"height" : _card.height + 'px'
	};

	let _domElement = elRender('<div>')
	
	elRender(_domElement)
		.addClass('el card draggable ' + data.name)
		.css(_params)
		.attr({
			id: data.id
		});

	share.set('domElement:' + data.id, _domElement);

	let _fieldDomElement = share.get('domElement:field');
	
	elRender(_fieldDomElement)
		.append(_domElement);
});