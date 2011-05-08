
fcViews.month = MonthView;

function MonthView(element, calendar) {
	var t = this;
	
	
	// exports
	t.render = render;
	
	
	// imports
	BasicView.call(t, element, calendar, 'month');
	var opt = t.opt;
	var renderBasic = t.renderBasic;
	var formatDate = calendar.formatDate;
	
	
	
	function render(date, delta) {
		if (delta) {
			date.setDate(1).addMonths(delta);
		}
		var start = date.clone().setDate(1).clearTime();
		var end = start.clone().addMonths(1);
		var visStart = start.clone();
		var visEnd = end.clone();
		var firstDay = opt('firstDay');
		var nwe = opt('weekends') ? 0 : 1;
		if (nwe) {
			skipWeekend(visStart);
			skipWeekend(visEnd, -1, true);
		}
		visStart.addDays(-((visStart.getDay() - Math.max(firstDay, nwe) + 7) % 7));
		visEnd.addDays((7 - visEnd.getDay() + Math.max(firstDay, nwe)) % 7);
		var rowCnt = visStart.diffWeeks(visEnd);
		if (opt('weekMode') == 'fixed') {
			visEnd.addWeeks(6 - rowCnt);
			rowCnt = 6;
		}
		t.title = formatDate(start, opt('titleFormat'));
		t.start = start;
		t.end = end;
		t.visStart = visStart;
		t.visEnd = visEnd;
		renderBasic(6, rowCnt, nwe ? 5 : 7, true);
	}
	
	
}
