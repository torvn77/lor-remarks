(function()
{
	var result = {};
	var els = document.querySelectorAll('.message-table > tbody > tr > td:first-child');
	for (var i = 0, len = els.length; i < len; ++i) {
		var cell = els[i];
		var name = cell.querySelector('a');
		if (name) {
			name = name.textContent;
			result[name] = cell.nextElementSibling.textContent.trim();
		}
	}
	console.log(JSON.stringify(result));
})();
