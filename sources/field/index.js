'use strict';

import share        from '../common/share'          ;
import event        from '../common/event'          ;
import defaults     from '../common/defaults'       ;
import common       from '../common'                ;

import Group        from '../group'                 ;
import Deck         from '../deck'                  ;
import Card         from '../card'                  ;
import Tips         from '../tips'                  ;
import addAutoSteps from '../autosteps/addAutoSteps';
import storage      from '../common/storage'        ;

import React, {Component} from 'react';
import {Map, List, fromJS} from 'immutable';
import {connect} from 'react-redux';

class fieldClass extends Component {
	
	render() {

		const {zoom} = this.props;

		/**
		 * Theme
		 */

		// TODO
		// get theme from storage
		// insert values to classes

		let classList = [
			"solitaireField"  ,
			"default_field"   ,
			"default_face"    ,
			"alternative_back"
		];

		/**
		 * Groups
		 */

		let groups = [];

		for(let i in this.props.groups) {

			const {
				id,
				position,
				decks
			} = this.props.groups[i];
			
			groups.push(
				<Group
					key = {id}
					{...{
						id      ,
						zoom    ,
						position,
						decks
					}}
					// {...this.props.groups[i]}
					// _decks = {this.props.groups[i].decks}
				/>
			);
		}

		/**
		 * Decks
		 */

		let decks = [];

		for (let i in this.props.decks) {

			const {
				id      ,
				position,
				showSlot,
				visible ,
				rotate  ,
				cards				
			} = this.props.decks[i];

			decks.push(
				<Deck
					key = {id}
					{...{
						id      ,
						position,
						zoom    ,
						showSlot,
						visible ,
						rotate  ,
						cards
					}}
					// {...this.props.decks[i]}
				/>
			);
		}

		let cards = []; // dragged cards

		for (let i in this.props.drag.cards) {

			const {
				id      ,
				name    ,
				flip    ,
				tip     ,
				position,
				visible ,
				rotate
			} = this.props.drag.cards[i];

			cards.push(
				<Card
					key = {id}
					{...{
						id      ,
						name    ,
						flip    ,
						tip     ,
						position,
						visible ,
						rotate  ,
						zoom
					}}
					// {...this.props.drag.cards[i]}
				/>
			)
		}

		return <div
			className = {classList.join(' ')}

			onMouseDown  = {this.Take}
			onMouseMove  = {this.Drag}
			onMouseUp    = {this.Put}

			onTouchStart = {this.Take}
			onTouchMove  = {this.Drag}
			onTouchEnd   = {this.Put}
		>
			{groups}
			{decks}
			{cards}
		</div>;
	}

	Take(data) {
		console.log('Take CARD', data);
	}

	Drag(data) {
		console.log('Drag CARD', data);
	}

	Put(data) {
		console.log('Put CARD', data);
	}

	/**
	 * Create new game field
	 * @param {Map} state
	 * @param {*} data
	 */
	static init(state, data) {

		// Init new state
		const _state = {};

		_state.nextId = 0;
		
		// TODO пометить группы
		_state.homeGroups = data.homeGroups ? data.homeGroups : [];
		
		_state.autoMoveToHomeOpenDecks = data.autoMoveToHomeOpenDecks
			? data.autoMoveToHomeOpenDecks
			: [];
		
		// устанвливаем тип хода по умолчанию
		_state['stepType'] = defaults.stepType;
		
		let _values = {
			"showTips"             : 'boolean', // вкл./выкл. подсказок
			"showTipsDestination"  : 'boolean', // Альтернативные подсказки
			"showTipPriority"      : 'boolean',
			"moveDistance"         : 'number' ,
			"zoom"                 : 'number' , // масштаб отображения
			// "movesAnimation"    : 'string' ,
			"animationTime"        : 'number' , // время анимации
			"showHistoryAnimation" : 'boolean',
			"showPrevFlipCard"     : 'boolean',
			"gameIsWon"            : 'boolean',
			// "noReplayHistory"      : 'boolean',
			"locale"               : 'string'
		};
		
		for (let valueName in _values) {
			
			_state[valueName] = typeof data[valueName] == _values[valueName]
			? data[valueName] 
			: defaults[valueName];
		}

		// условие выигрыша
		// share.set('winCheck', data.winCheck);
		_state.winCheck = data.winCheck;
		
		// Настройки оформления (если нет сохранений)
		_state.theme = data.theme;

		// Дополнительные настройки игры
		if (data.preferences) {

			let _pref = storage.get('pref'),
			    _preferences = {}          ,
			    _prefData    = {}          ;

			for (let prefName in data.preferences) {
				if (typeof prefName == 'string') {

					_preferences[prefName] = data.preferences[prefName];

					_prefData[prefName] = _pref && typeof _pref[prefName] != 'undefined'
						? _pref[prefName]
						: data.preferences[prefName].value;
				}
			}

			// share.set('gamePreferences',     _preferences);
			_state['gamePreferences'] = _preferences;
			
			// share.set('gamePreferencesData', _prefData);
			_state['gamePreferencesData'] = _prefData;
		} else {
			// share.set('gamePreferences', {});
			_state['gamePreferences'] = {};
		}

		_state.tipsParams = {};

		// параметры отображения подсказок
		for (let tipParamName in defaults.tipsParams) {
			_state.tipsParams[tipParamName] = (data.tipsParams && typeof data.tipsParams[tipParamName] != 'undefined')
				? data.tipsParams[tipParamName]
				: defaults.tipsParams[tipParamName]
		}

		_state.inputParams = {};
		
		// параметры ввода
		for (let inputParamName in defaults.inputParams) {
			_state.inputParams[inputParamName] = (data.inputParams && typeof data.inputParams[inputParamName] != 'undefined')
				? data.inputParams[inputParamName]
				: defaults.inputParams[inputParamName]
		}
		
		// дополнительные параметры отображения
		// начальная позиция порядка отображения элементов
		if (typeof data.startZIndex == 'number') {
			_state['start_z_index'] = data.startZIndex;
		}
		
		// инициализация автоходов
		if (data.autoSteps || data.stepTypes) {
			// this.autoSteps = addAutoSteps(data.autoSteps);
		}
		
		// NOTE: на событие подписан deckActions
		// если ставить позже отрисовки элементов, переделать
		// event.dispatch('initField', data);
		
		/**
		 * Groups
		 */

		 _state.groups = [];
		
		// Отрисовка элементов
		if (data.groups) {
			
			for (let groupName in data.groups) {
				
				// data.groups[groupName].name = groupName;
				// Group.add(data.groups[groupName]);
				
				_state.groups.push(
					Group.init(
						{
							"name" : groupName
						},
						data.groups[groupName],
						() => _state.nextId++
					)
				);
			}
		}

		/**
		 * Decks
		 */
		
		_state.decks = [];

		// init decks from field
		if (data.decks) {

			for (let e in data.decks) {

				// Deck.addDeck(data.decks[e]);

				_state.decks.push(
					Deck.init(
						{
							"parent" : "field"
							// "showPrevFlipCard" : _state.showPrevFlipCard
						},
						data.decks[e],
						() => _state.nextId++
					)
				);
			}
		}

		/**
		 * Fill
		 */
		
		// fill decks
		// top priority
		if (data.fill) {
			
			// for-in groups
			//   for-in decks

			// for in decks
		}

		// событие: игра началась
		// event.dispatch('newGame');

		_state.drag = {
			"cursor" : false,
			"cards"  : []
		};

		// return fromJS(_state);
		return JSON.parse( JSON.stringify(_state) );
	}

	static changeTipsMode(state, data) {

		// console.log('changeTipsMode', data);

		// let _state = state.toJS();
		let _state = state;

		_state.showTips = data;

		// return fromJS(_state);
		return _state;
	}

	static takeCards(state, data) {

		// let _state = state.toJS();
		let _state = state;
		
		console.log('Take cards', _state, decks);

		/**
		 * All decks
		 */

		let decks = [];
	
		// Decks from Field
		decks.push(
			..._state.decks
		);
	
		// Decks from groups
		for (let i in _state.groups) {
			decks.push(
				..._state.groups[i].decks
			);
		}
	
		// Departure deck
		let deck = decks.filter(
			e => e.visible && e.cards.some(
				c => c.id == data.id
			)
		)[0];

		_state.drag.cards = deck && deck.cards.splice( deck.cards.findIndex(e => e.id == data.id) );

		_state.drag.start = {
			"x" : data.x,
			"y" : data.y
		};

		_state.drag.cursor = {
			"x" : data.x,
			"y" : data.y
		};

		_state.drag.cards && _state.drag.cards.forEach(e => {

			console.log( e.name, JSON.stringify(e.position), JSON.stringify(e.offset) );

			e.position = e.offset;
		});

		console.log('takeCards', data, _state);
		
		// return fromJS(_state);
		return JSON.parse( JSON.stringify(_state) );
	}

	static moveCards(state, data) {

		// let _state = state.toJS();
		let _state = state;

		for (let i in _state.drag.cards) {

			let card = _state.drag.cards[i];

			card.position = {
				"x" : card.position.x - _state.drag.cursor.x + data.x,
				"y" : card.position.y - _state.drag.cursor.y + data.y
			};
		}

		_state.drag.cursor = {
			"x" : data.x,
			"y" : data.y
		};

		// return fromJS(_state);
		return JSON.parse( JSON.stringify(_state) );
	}

	static putCards(state, data) {

		console.log('putCards', data);

		return state;
	}
}

// export default connect(state => state.toJS())(fieldClass);
export default connect(state => state)(fieldClass);

// export default Field;