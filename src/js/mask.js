window.mask = function (domInput, expression, isCurrency) {

	var ControlKeys = [0x08, 0x09, 0x0D, 0x10, 0x11, 0x12, 0x1B, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x2E];
	var masks = {};
    masks.C = /[a-zA-ZÂ-ÖÙ-Ýà-öù-ýÿ]/;
    masks.N = /[0-9]/;
    masks.A = /[a-zA-ZÂ-ÖÙ-Ýà-öù-ýÿ0-9]/;
    masks.S = /[^a-zA-ZÂ-ÖÙ-Ýà-öù-ýÿ0-9]/;
    masks.Z = /[.]/;

    if (!domInput.maxlength || domInput.maxLength > expression.length) {
		domInput.maxLength = expression.length;
	}

    if (isCurrency) {
        domInput.style.textAlign = "right";
        if (window.attachEvent) {
            domInput.attachEvent('onkeyup', function () { maskNumber(event); });
        } else {
            attachEventFF("keyup", function () { maskNumber(event); });
            attachEventFF("keydown", function () { maskNumber(event); });
        }
    } else {
        if (window.attachEvent) {
            domInput.attachEvent('onkeypress', function () { maskString(event); });
        } else {
            attachEventFF("keypress", function () { maskString(event); });
        }
	}

    function attachEventFF (event, handler) {
        handler.func = function (e) {
            window.event = e;
            return handler();
        };
        domInput.addEventListener(event, handler.func, false);
    }
	
    function getCaret () {
        // IE
        if (document.selection != null) {
            var t = document.selection.createRange().duplicate();
            t.moveEnd("character", domInput.value.length);
            return (t.text == "") ? domInput.value.length : domInput.value.lastIndexOf(t.text);
        }
        //FF
        else if (domInput.selectionStart != null) {
            return domInput.selectionStart;
        }
        else {
            return -1;
        }
	}
	
    function maskNumber (event) {
        var negative = (domInput.value.indexOf("-") != -1) ? 1 : 0;
        var STR = domInput.value.replace(/[^0-9]+/gi, "");
        var  c, eL = expression.length - 1, m, res = "", vL = STR.length - 1;
        while (vL >= 0) {
            c = STR.charAt(vL--);
            m = expression.charAt(eL--);
            if (m != "N" && m != c) {
                res = c + m + res;
                eL--;
            } else {
                res = c + res;
            }
        }
        domInput.value = ((negative) ? "-" : "") + res;
        setCaret(event, domInput.value.length);
	}
	
    function maskString (event) {
        var p = getCaret(event);
        var k = event.keyCode ? event.keyCode : event.which;
        var m = expression.charAt(p);

        if (m != "") {
            for (var i = 0; i < ControlKeys.length; i++) {
                if (k == ControlKeys[i]) {
                    return;
                }
            }
            var sf = String.fromCharCode(k);
            if ("CNASZ".indexOf(m) != -1 && !masks[m].test(sf)) {
                if (document.all) {
                    event.returnValue = false;
                } else {
                    event.preventDefault();
                }
            } else {
                if ("CNASZ".indexOf(m) == -1) {
                    if (domInput.value.charAt(p) != m){
						domInput.value = domInput.value.substr(0, p) + m + domInput.value.substr(p, domInput.value.length);
					}
                    setCaret(event, p + 1);
                    maskString(event);
                }
            }
        }
	}

    function setCaret (event, i) {
        // IE
        if (document.selection != null) {
            var r = domInput.createTextRange();
            r.moveStart("character", i + 1);
            r.moveEnd("character", i - domInput.value.length);
            r.select();
        }
        // FF
        else if (domInput.selectionStart != null) {
            domInput.setSelectionRange(i, i);
            domInput.selectionStart = i;
            domInput.selectionEnd = i;
        }

	}

};