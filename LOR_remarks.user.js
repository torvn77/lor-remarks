// ==UserScript==
// @name           LOR remarks
// @description    Store user remarks in browser, easy export to clipboard.
// @description:ru Сохраняет заметки о пользователе в браузере, простой экспорт в буфер обмена.
// @version        1.6
// @namespace      tenno-seremel
// @author         Tenno Seremel
// @include        https://www.linux.org.ru/*
// @include        http://www.linux.org.ru/*
// @run-at         document-end
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setClipboard
// ==/UserScript==
(function(){
	'use strict';
	function make_button(text, title)
	{
		var result = document.createElement('button');
		result.setAttribute('style', 'margin-top: .5em;padding: .1em 1ex;');
		result.setAttribute('type', 'button');
		if (title) {
			result.setAttribute('title', title);
		}
		result.textContent = text;
		return result;
	}
	var cache = {};
	var PREFIX = 'r.';
	var PREFIX_LEN = PREFIX.length;
	var REMARK_WRAP = document.createElement('div');
	REMARK_WRAP.setAttribute('style', 'margin-bottom: .5em;');
	var REMARK_TEXT = document.createElement('div');
	var REMARK_EDIT = document.createElement('textarea');
	REMARK_EDIT.setAttribute('style', 'display: none;box-sizing: border-box;border: 1px solid #DDD;height: 5em;background: transparent;width: 100%;padding: .5em 0 0 0;color: inherit;margin: .5em 0 0 0;');
	var BUTTON_EDIT = make_button('Редактировать');
	var BUTTON_SAVE = make_button('Сохранить');
	BUTTON_SAVE.style.display = 'none';
	var BUTTON_EXPORT = make_button('➚', 'Экспортировать заметки');
	var BUTTON_IMPORT_TOGGLE = make_button('➘', 'Импортировать заметки (показать/скрыть)');
	var BUTTON_DELETE_ALL = make_button('✗', 'Удалить все заметки (медленно даже для 500 пользователей)');
	var IMPORT_WRAP_EL = document.createElement('div');
	IMPORT_WRAP_EL.setAttribute('style', 'display: none;margin-bottom: 1em;');
	var IMPORT_TEXTAREA_EL = document.createElement('textarea');
	IMPORT_TEXTAREA_EL.setAttribute('style', 'box-sizing: border-box;width: 100%;height: 10em;');
	IMPORT_WRAP_EL.appendChild(IMPORT_TEXTAREA_EL);
	var BUTTON_IMPORT = make_button('Импортировать', 'Медленно даже для 500 пользователей');
	IMPORT_WRAP_EL.appendChild(BUTTON_IMPORT);
	var IMPORT_MESSAGE_EL = document.createElement('span');
	IMPORT_MESSAGE_EL.setAttribute('style', 'margin-left: 1ex;');
	IMPORT_WRAP_EL.appendChild(IMPORT_MESSAGE_EL);
	var ALL_NICKNAMES_RULE = '.sign > a[itemprop="creator"], .vcard > .nickname';

	function make_remark_el(user, remark)
	{
		// init
		var w = REMARK_WRAP.cloneNode(false);
		var t = REMARK_TEXT.cloneNode(false);
		var e = REMARK_EDIT.cloneNode(false);
		var button_edit = BUTTON_EDIT.cloneNode(true);
		var button_save = BUTTON_SAVE.cloneNode(true);
		// work
		t.textContent = remark;
		e.dataset.user = user;
		button_edit.addEventListener('click', on_button_edit, false);
		button_save.addEventListener('click', on_button_save, false);
		// fill
		w.appendChild(t);
		w.appendChild(e);
		w.appendChild(button_edit);
		w.appendChild(button_save);
		return w;
	}
	function on_button_edit(ev)
	{
		ev.preventDefault();
		var button = ev.target;
		button.style.display = 'none';
		button.nextElementSibling.style.display = ''; // save button
		var edit_box = button.previousElementSibling;
		edit_box.textContent = GM_getValue(PREFIX + edit_box.dataset.user, '');
		edit_box.style.display = ''; // edit box
		edit_box.focus();
	}
	function on_button_save(ev)
	{
		ev.preventDefault();
		var button = ev.target;
		button.style.display = 'none';
		var edit_button = button.previousElementSibling;
		edit_button.style.display = '';
		var edit_box = edit_button.previousElementSibling;
		edit_box.style.display = 'none';
		var user = edit_box.dataset.user;
		var value = edit_box.value.trim();
		if (value) {
			GM_setValue(PREFIX + user, value);
		} else {
			GM_deleteValue(PREFIX + user);
		}
		// update all descriptions on a page
		var els = document.querySelectorAll(ALL_NICKNAMES_RULE);
		for (var element of els) {
			var this_user = element.textContent;
			if (user === this_user) {
				element.parentNode.nextElementSibling.firstChild.textContent = value;
			}
		}
	}
	function on_button_export(ev)
	{
		ev.preventDefault();
		var result = {};
		var keys = GM_listValues();
		keys.forEach(function(key) {
			if (key.startsWith(PREFIX)) {
				result[key.substring(PREFIX_LEN)] = GM_getValue(key);
			}
		});
		GM_setClipboard(JSON.stringify(result));
	}
	function on_button_import_toggle(ev)
	{
		ev.preventDefault();
		IMPORT_WRAP_EL.style.display = (IMPORT_WRAP_EL.style.display === 'none') ? 'block' : 'none';
	}
	function on_button_delete_all(ev)
	{
		ev.preventDefault();
		if (confirm('Удалить все заметки?')) {
			var keys = GM_listValues();
			keys.forEach(function(key) {
				if (key.startsWith(PREFIX)) {
					GM_deleteValue(key);
				}
			});
		}
	}
	function on_button_import(ev)
	{
		ev.preventDefault();
		try {
			var data = JSON.parse(IMPORT_TEXTAREA_EL.value);
			var count = 0;
			console.log(data);
			for (var key in data) {
				try {
					GM_setValue(PREFIX + key, data[key].toString());
					++count;
				} catch(e){}
			}
			IMPORT_MESSAGE_EL.textContent = 'Импортировано ' + count + ' описаний.';
			IMPORT_TEXTAREA_EL.value = '';
		} catch(e) {
			IMPORT_MESSAGE_EL.textContent = 'Не удалось преобразовать данные в JSON.';
		}
	}

	var els = document.querySelectorAll(ALL_NICKNAMES_RULE);
	for (var element of els) {
		var user = element.textContent;
		if (!(user in cache)) {
			cache[user] = GM_getValue(PREFIX + user, '');
		}
		var user_remark_el = make_remark_el(user, cache[user]);
		var sign_el = element.parentNode;
		sign_el.parentNode.insertBefore(user_remark_el, sign_el.nextElementSibling);
	}
	cache = null;
	var insert_point_parent = document.getElementById('loginGreating') || document.body;
	var insert_point_el = insert_point_parent.firstChild;
	// export button
	BUTTON_EXPORT.addEventListener('click', on_button_export, false);
	insert_point_parent.insertBefore(BUTTON_EXPORT, insert_point_el);
	// import togle button
	BUTTON_IMPORT_TOGGLE.addEventListener('click', on_button_import_toggle, false);
	insert_point_parent.insertBefore(BUTTON_IMPORT_TOGGLE, insert_point_el);
	// delete all button
	BUTTON_DELETE_ALL.addEventListener('click', on_button_delete_all, false);
	insert_point_parent.insertBefore(BUTTON_DELETE_ALL, insert_point_el);
	// import dialog
	BUTTON_IMPORT.addEventListener('click', on_button_import, false);
	document.body.insertBefore(IMPORT_WRAP_EL, document.body.firstChild);
})();
