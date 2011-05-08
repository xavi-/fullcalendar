/**
 * @preserve MightyDate v0.4
 * http://github.com/arshaw/mightydate
 *
 * Copyright 2011, Adam Shaw
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Sun May 8 00:19:07 2011 -0700
 */


var MightyDate = (function(Date, undefined) {


/** @const */ var FULLYEAR_INDEX     = 0;
/** @const */ var MONTH_INDEX        = 1;
/** @const */ var DATE_INDEX         = 2;
/** @const */ var HOURS_INDEX        = 3;
/** @const */ var MINUTES_INDEX      = 4;
/** @const */ var SECONDS_INDEX      = 5;
/** @const */ var MILLISECONDS_INDEX = 6;
/** @const */ var DAY_INDEX          = 7;
/** @const */ var YEAR_INDEX         = 8;
/** @const */ var WEEK_INDEX         = 9;

/** @const */ var DAY_MS = 86400000;

var methodSubjects = [
	'FullYear',     // 0
	'Month',        // 1
	'Date',         // 2
	'Hours',        // 3
	'Minutes',      // 4
	'Seconds',      // 5
	'Milliseconds', // 6
	'Day',          // 7
	'Year'          // 8
];
var subjectPlurals = [
	'Years',        // 0
	'Months',       // 1
	'Days'          // 2
];
var otherGetters = [
	'getTimezoneOffset',
	'getTime',
	'valueOf',
	'toDateString',
	'toTimeString',
	'toLocaleString',
	'toLocaleDateString',
	'toLocaleTimeString',
	'toJSON'
];
var formatStringRE = new RegExp(
	"(" +                                             // 1
	"\\((" + "('.*?'|\\(.*?\\)|.)*?" + ")\\)" + "|" + // 2 3
	"\\{(" + "('.*?'|.)*?"           + ")\\}" + "|" + // 4 5
	"\\[(" + "('.*?'|.)*?"           + ")\\]" + "|" + // 6 7
	"'(.*?)'"                                 + "|" + // 8
	"(.[^({[']*)" +                                   // 9
	")" +
	"(.*)" // 10
);
var UTC = Date.UTC;
var proto = MightyDate.prototype;
var i;
var noopSignal = {};



/* Constructor
------------------------------------------------------------------------------*/


function MightyDate() {
	if (!(this instanceof MightyDate)) {
		// when MightyDate is called as a method. TODO: write test
		return init(new MightyDate(noopSignal), arguments);
	}
	init(this, arguments);
}


function init(mightyDate, args) {
	var len = args.length;
	if (!len) {
		// set to now
		setLocalDate(mightyDate, new Date());
	}
	else if (len == 1) {
		var arg = args[0];
		if (isNumber(arg)) {
			setLocalDate(mightyDate, new Date(arg));
		}
		else if (isString(arg)) {
			_setUniversalDate(mightyDate, new Date(0));
			parse(mightyDate, arg);
		}
		else if (arg instanceof Date) {
			setLocalDate(mightyDate, new Date(+arg));
		}
		else if (arg instanceof MightyDate) {
			_setUniversalDate(mightyDate, new Date(+getUniversalDate(arg)));
		}
		else if (arg != noopSignal) {
			_setUniversalDate(mightyDate, NaN); // make it an Invalid Date. TODO: write test
		}
	}
	else {
		_setUniversalDate(mightyDate, new Date(UTC.apply(Date, args)));
	}
	return mightyDate;
}



/* Standard Methods + Adding/Diffing Methods
-----------------------------------------------------------------------------*/


for (i=0; i<WEEK_INDEX; i++) (function(subject, i) { // TODO: rename i to fieldIndex

	if (i != YEAR_INDEX) { // there is no getUTCYear
	
		// getFullYear
		// getMonth
		// getDate
		// getHours
		// getMinutes
		// getSeconds
		// getMilliseconds
		// getDay
		proto['get' + subject] = function() {
			return getUniversalDate(this)['getUTC' + subject]();
		};
	
	}
	
	// getFullYear
	// getMonth
	// getDate
	// getHours
	// getMinutes
	// getSeconds
	// getMilliseconds
	// getDay
	// getYear
	proto['getUTC' + subject] = function() {
		return getLocalDate(this)['getUTC' + subject]();
	};
	
	if (i != DAY_INDEX) { // there is no setDay or setUTCDay methods
	
		// setFullYear
		// setMonth
		// setDate
		// setHours
		// setMinutes
		// setSeconds
		// setMilliseconds
		// setYear
		proto['set' + subject] = function(value, preventOverflow) {
			value = parseInt(value); // TODO: write tests
			var month = i == MONTH_INDEX ? value % 12 : this.getMonth();
			var args = arguments;
			if (args.length == 2 && (isBoolean(preventOverflow) || preventOverflow === undefined)) {
				args = [value];
			}
			getUniversalDate(this)['setUTC' + subject].apply(
				getUniversalDate(this),
				args
			);
			clearLocalDate(this);
			// TODO: write tests for year overflow
			if (i < DATE_INDEX && preventOverflow === true && this.getMonth() != month) { // fullyear or month
				this.addMonths(-1)
					.setDate(
						getDaysInMonth(this.getFullYear(), this.getMonth())
					);
			}
			return this; // for chaining
		};
	
		if (i != YEAR_INDEX) { // there is no setUTCYear method
	
			// setUTCFullYear
			// setUTCMonth
			// setUTCDate
			// setUTCHours
			// setUTCMinutes
			// setUTCMilliseconds
			proto['setUTC' + subject] = function() {
				var localDate = getLocalDate(this);
				localDate['setUTC' + subject].apply(
					localDate,
					arguments
				);
				setUniversalDate(this, localToUniversal(localDate));
				return this; // for chaining
			};
	
		}
	
	}
	
	if (i < DAY_INDEX) { // not day and not year
	
		// addYears
		// addMonths
		// addDays
		// addHours
		// addMinutes
		// addSeconds
		// addMilliseconds
		proto['add' + (subjectPlurals[i] || subject)] = function(delta, preventOverflow) {
			delta = parseInt(delta);
			this['set' + subject](
				this['get' + subject]() + delta,
				preventOverflow
			);
			return this; // for chaining
		};
		
		// diffYears
		// diffMonths
		// diffDays
		// diffHours
		// diffMinutes
		// diffSeconds
		// diffMilliseconds
		proto['diff' + (subjectPlurals[i] || subject)] = function(otherDate, exact) {
			return diff(i, this, otherDate, exact);
		};
	
	}

})(methodSubjects[i], i);


for (i=0; i<otherGetters.length; i++) (function(getter) {

	proto[getter] = function() {
		return getLocalDate(this)[getter]();
	};

})(otherGetters[i]);


proto.getYear = function() {
	return getUniversalDate(this).getUTCFullYear() - 1900;
};


proto.setTime = function(t) {
	setLocalDate(this, new Date(t));
};


function diff(fieldIndex, date, otherDate, exact) { // TODO: write tests
	var d1 = getUniversalDate(date);
	var d2 = extractUniversalDate(otherDate);
	var v;
	if (fieldIndex < DATE_INDEX) { // fullyear or month
		v = (d2.getUTCFullYear() * 12 + d2.getUTCMonth()) - 
			(d1.getUTCFullYear() * 12 + d1.getUTCMonth()) +
			((d2 - UTC(d2.getUTCFullYear(), d2.getUTCMonth(), 1)) -
			 (d1 - UTC(d1.getUTCFullYear(), d1.getUTCMonth(), 1))) / DAY_MS / 31;
		if (fieldIndex == FULLYEAR_INDEX) {
			v /= 12;
		}
	}else{
		v = (d2 - d1) / [ // milliseconds in a...
			DAY_MS,  // day
			3600000, // hour
			60000,   // minute
			1000,    // second
			1,       // millisecond
			0,
			0,
			DAY_MS * 7 // week
			][fieldIndex - 2];
	}
	if (!exact) {
		v = Math.floor(v);
	}
	return v;
}



/* Week (TODO: write tests)
----------------------------------------------------------------------------*/


proto.diffWeeks = function(otherDate, exact) {
	return diff(WEEK_INDEX, this, otherDate, exact);
};


proto.addWeeks = function(delta) {
	return this.addDays(delta * 7);
};


proto.getWeek = function(d) {
	return _getWeek(this.getFullYear(), this.getMonth(), this.getDate());
};


proto.getUTCWeek = function(d) {
	return _getWeek(this.getUTCFullYear(), this.getUTCMonth(), this.getUTCDate());
};


function _getWeek(year, month, date) {
	var d = new Date(UTC(year, month, date));
	var currentWeek1 = getWeek1(year);
	var week1 = currentWeek1;
	if (d < currentWeek1) {
		week1 = getWeek1(year-1);
	}else{
		var nextWeek1 = getWeek1(year+1);
		if (d >= nextWeek1) {
			week1 = nextWeek1;
		}
	}
	return Math.floor(Math.round((d - week1) / DAY_MS) / 7) + 1;
}


function getWeek1(year) {
	var d = new Date(UTC(year, 0, 4));
	d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
	return d;
}



/* Non-Standard Methods
-----------------------------------------------------------------------------*/


proto.equals = function(date) {
	return +getUniversalDate(this) == +extractUniversalDate(date);
};


proto.before = function(date) {
	return getUniversalDate(this) < extractUniversalDate(date);
};


proto.after = function(date) {
	return getUniversalDate(this) > extractUniversalDate(date);
};


proto.valid = function() {
	return !isNaN(+getUniversalDate(this));
};


proto.clearTime = function() {
	return this.setHours(0, 0, 0, 0);
};


proto.clone = function() {
	return new MightyDate(this);
};


proto.toDate = function() {
	return new Date(+this);
};



/* Parsing
-----------------------------------------------------------------------------*/


MightyDate.parsers = [
	parseISO
];


MightyDate.parse = function(str) {
	return +new MightyDate(''+str);
};


function parse(date, str) {
	var parsers = MightyDate.parsers;
	for (var i=0; i<parsers.length; i++) {
		if (parsers[i](date, str)) {
			return;
		}
	}
	setLocalDate(date, new Date(str));
}


function parseISO(date, str) {
	var m = str.match(/^(\d{4})(-(\d{2})(-(\d{2})([T ](\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|(([-+])(\d{2})(:?(\d{2}))?))?)?)?)?$/);
	if (!m) {
		return false;
	}
	var args1 = [
		m[1],
		m[3] ? m[3] - 1 : 0,
		m[5] || 1
	];
	var args2 = [
		m[7] || 0,
		m[8] || 0,
		m[10] || 0,
		m[12] ? Number('0.' + m[12]) * 1000 : 0
	];
	if (m[14]) {
		date.setUTCFullYear.apply(date, args1);
		date.setUTCHours.apply(date, args2);
		var offset = Number(m[16]) * 60 + (m[18] ? Number(m[18]) : 0);
		offset *= m[15] == '-' ? 1 : -1;
		date.addMinutes(offset);
	}else{
		date.setFullYear.apply(date, args1);
		date.setHours.apply(date, args2);
	}
	return true;
}



/* Formatting
---------------------------------------------------------------------------------------*/


MightyDate.defaultLocale = '';
MightyDate.locales = {
	'': {
		monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
		monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
		dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
		dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
		amDesignator: 'AM',
		pmDesignator: 'PM'
	}
};


MightyDate.formatters = {
	i: "yyyy-MM-dd'T'HH:mm:ss",
	u: "yyyy-MM-dd'T'HH:mm:ssK"
};


proto.toString = function(otherDate, formatString, settings) {
	if (!arguments.length || !this.valid()) {
		return getLocalDate(this).toString();
	}
	return format(false, this, otherDate, formatString, settings);
};


proto.toUTCString = proto.toGMTString = function(otherDate, formatString, settings) {
	if (!arguments.length || !this.valid()) {
		return getLocalDate(this).toUTCString();
	}
	return format(true, this, otherDate, formatString, settings);
};


function format(isUTC, date, otherDate, formatString, settings) {

	if (isString(otherDate)) {
		settings = formatString;
		formatString = otherDate;
		otherDate = null;
	}
	
	var locales = MightyDate.locales;
	var localeSettings = locales[MightyDate.defaultLocale] || {};
	if (isString(settings)) {
		localeSettings = locales[settings] || localeSettings;
		settings = {};
	}else{
		settings = settings || {};
	}
	
	function getSetting(name) {
		return settings[name] || localeSettings[name];
	}
	
	return _format(isUTC, date, otherDate, formatString, getSetting);
}


function _format(isUTC, date, otherDate, formatString, getSetting, uniqueness) {

	var match;
	var tokenReplacement;
	var subOutput;
	var output = '';
	var _getField = isUTC ? getUTCField : getLocalField;
	
	function getField(i) {
		if (uniqueness) {
			for (var j=i; j>=0; j--) {
				uniqueness.push(_getField(date, j));
			}
		}
		return _getField(date, i);
	}
	
	while (formatString) {
		match = formatStringRE.exec(formatString);
		if (match[9] !== undefined) {
			// tokens
			var tokenSoup = match[9];
			var tokenSoupLength = tokenSoup.length;
			var tokenStart = 0;
			var tokenEnd = tokenSoupLength;
			while (tokenStart < tokenSoupLength) {
				tokenReplacement = undefined;
				// find the longest formatter starting at tokenStart
				while (tokenEnd > tokenStart) {
					tokenReplacement = getTokenReplacement(
						tokenSoup.substring(tokenStart, tokenEnd), // the potential token
						isUTC, date, getField, getSetting, uniqueness
					);
					if (tokenReplacement !== undefined) {
						output += tokenReplacement;
						tokenStart = tokenEnd; // continue looking after
						break;
					}
					tokenEnd--;
				}
				if (tokenReplacement === undefined) {
					// swallow single character and continue after
					output += formatString.charAt(tokenStart);
					tokenStart++;
				}
				tokenEnd = tokenSoupLength;
			}
		}
		else if (match[2] !== undefined) {
			// only if non-zero
			subOutput = _format(isUTC, date, otherDate, match[2], getSetting);
			if (Number(subOutput.replace(/\D/g, ''))) {
				output += subOutput;
			}
		}
		else if (match[4] !== undefined) {
			// switch to other date
			if (otherDate) {
				output += _format(isUTC, otherDate, date, match[4], getSetting);
			}
		}
		else if (match[6] !== undefined) {
			// only if different
			var otherSubUniqueness = [];
			var otherSubOutput = _format(isUTC, otherDate, date, match[6], getSetting, otherSubUniqueness);
			var subUniqueness = [];
			subOutput = _format(isUTC, date, otherDate, match[6], getSetting, subUniqueness);
			if (subOutput != otherSubOutput || subUniqueness.join() != otherSubUniqueness.join()) {
				output += subOutput;
			}
		}
		else if (match[8] !== undefined) {
			if (match[8]) {
				output += match[8]; // quoted text
			}else{
				output += "'"; // escaped quote
			}
		}
		formatString = match[10];
	}
	
	return output;
}


function getTokenReplacement(token, isUTC, date, getField, getSetting, uniqueness) {
	var formatter = MightyDate.formatters[token];
	if (formatter) {
		if (isString(formatter)) {
			return _format(isUTC, date, null, formatter, getSetting, uniqueness);
		}
		return formatter(date, getSetting, isUTC);
	}
	switch (token) {
		case 's'    : return getField(SECONDS_INDEX);
		case 'ss'   : return zeroPad(getField(SECONDS_INDEX));
		case 'm'    : return getField(MINUTES_INDEX);
		case 'mm'   : return zeroPad(getField(MINUTES_INDEX));
		case 'h'    : return getField(HOURS_INDEX) % 12 || 12;
		case 'hh'   : return zeroPad(getField(HOURS_INDEX) % 12 || 12);
		case 'H'    : return getField(HOURS_INDEX);
		case 'HH'   : return zeroPad(getField(HOURS_INDEX));
		case 'd'    : return getField(DATE_INDEX);
		case 'dd'   : return zeroPad(getField(DATE_INDEX));
		case 'ddd'  : return getSetting('dayNamesShort')[getField(DAY_INDEX)];
		case 'dddd' : return getSetting('dayNames')[getField(DAY_INDEX)];
		case 'M'    : return getField(MONTH_INDEX) + 1;
		case 'MM'   : return zeroPad(getField(MONTH_INDEX) + 1);
		case 'MMM'  : return getSetting('monthNamesShort')[getField(MONTH_INDEX)];
		case 'MMMM' : return getSetting('monthNames')[getField(MONTH_INDEX)];
		case 'yy'   : return (getField(FULLYEAR_INDEX)+'').substring(2);
		case 'yyyy' : return getField(FULLYEAR_INDEX);
		case 't'    :
		case 'tt'   :
		case 'T'    :
		case 'TT'   :
			var s = getField(HOURS_INDEX) < 12 ? getSetting('amDesignator') : getSetting('pmDesignator');
			if (token.length == 1) s = s.substr(0, 1);
			if (token > 'TT') s = s.toLowerCase(); // token == 't' || token == 'tt'
			return s;
		case 'K'    : if (isUTC) return 'Z';
		case 'z'    :
		case 'zz'   :
		case 'zzz'  :
			var tzo = date.getTimezoneOffset();
			var sign = tzo < 0 ? '+' : '-';
			var hours = Math.floor((tzo = Math.abs(tzo)) / 60);
			var minutes = tzo % 60;
			return sign + 
				(token == 'z' ? hours : zeroPad(hours)) +
				((token == 'z' || token == 'zz') ? '' : ':' + zeroPad(minutes));
		case 'S'    :
			var d = getField(DATE_INDEX);
			if (d > 10 && d < 20) return 'th';
			return ['st', 'nd', 'rd'][d % 10 - 1] || 'th';
		case 'W'    :
			return _getWeek(
				getField(FULLYEAR_INDEX),
				getField(MONTH_INDEX),
				getField(DATE_INDEX)
			);
		case 'WW'    :
			return zeroPad(
				_getWeek(
					getField(FULLYEAR_INDEX),
					getField(MONTH_INDEX),
					getField(DATE_INDEX)
				)
			);
	}
}


function getLocalField(date, i) {
	return date['get' + methodSubjects[i]]();
}


function getUTCField(date, i) {
	return date['getUTC' + methodSubjects[i]]();
}



/* Misc Class Methods
-----------------------------------------------------------------------------*/


MightyDate.now = Date.now;


MightyDate.UTC = UTC;


MightyDate.getDaysInMonth = getDaysInMonth;



/* Date Utilities
--------------------------------------------------------------------------------*/


function getDaysInMonth(year, month) {
	return 32 - new Date(Date.UTC(year, month, 32)).getUTCDate();
}


function extractUniversalDate(date) {
	if (date instanceof MightyDate) {
		return getUniversalDate(date);
	}
	else if (date instanceof Date) {
		return localToUniversal(date);
	}
	return getUniversalDate(new MightyDate(date));
}


function localToUniversal(localDate) {
	return new Date(UTC(
		localDate.getFullYear(),
		localDate.getMonth(),
		localDate.getDate(),
		localDate.getHours(),
		localDate.getMinutes(),
		localDate.getSeconds(),
		localDate.getMilliseconds()
	));
}


function universalToLocal(universalDate) {
	return new Date(
		universalDate.getUTCFullYear(),
		universalDate.getUTCMonth(),
		universalDate.getUTCDate(),
		universalDate.getUTCHours(),
		universalDate.getUTCMinutes(),
		universalDate.getUTCSeconds(),
		universalDate.getUTCMilliseconds()
	);
}



/* General Utilities
--------------------------------------------------------------------------------*/


function zeroPad(n) {
	return (n < 10 ? '0' : '') + n;
}


function isString(x) {
	return typeof x == 'string';
}


function isNumber(x) {
	return typeof x == 'number';
}


function isBoolean(x) {
	return typeof x == 'boolean';
}



/* Internal Utilities
---------------------------------------------------------------------------------*/

// _ is universal date
// $ is local date


function getUniversalDate(mightyDate) {
	return mightyDate._;
}


function setUniversalDate(mightyDate, universalDate) {
	_setUniversalDate(mightyDate, universalDate);
	clearLocalDate(mightyDate);
}


function _setUniversalDate(mightyDate, universalDate) {
	mightyDate._ = universalDate;
}


function getLocalDate(mightyDate) {
	if (mightyDate.$ === undefined) {
		mightyDate.$ = universalToLocal(mightyDate._);
	}
	return mightyDate.$;
}


function setLocalDate(mightyDate, localDate) {
	mightyDate.$ = localDate;
	mightyDate._ = localToUniversal(localDate);
}


function clearLocalDate(mightyDate) {
	delete mightyDate.$;
}



return MightyDate;

})(Date);
