'use strict';

import defaults from '../common/defaults';
import share    from '../common/share'   ;


export default e => {

	console.log('drawPreferences', share.get('locale'));

	let _locale = null;
		_locale = _locale || share.get('locale');
		_locale = _locale || defaults.locale;

	console.log('locale', _locale);

	let _html = {
		"ru" : require('html!./preferncesTemplate.ru.html'),
		"en" : require('html!./preferncesTemplate.en.html')
	};

	// $("#gpCommit")
	// 	.parent()
	// 	.before(_html);

	try {

		let el = document.getElementById('gpCommit');

		let div = document.createElement('div');
		div.innerHTML = _html[_locale];

		el.parentNode.insertBefore(div, el);
	} catch (e) {}
};
