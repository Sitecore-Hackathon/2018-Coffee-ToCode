if (typeof ($xa) !== "undefined") {
    (function ($) {
        if (typeof (scBrowser) !== "undefined") {
            scBrowser.prototype.closePopups = function(reason, exclusions) {
                if (window.top != null) {
                    if (window.top.popups != null) {
                        if (reason == "mainWindowBlur") {
                            return;
                        }

                        for (var n = 0; n < window.top.popups.length; n++) {
                            if (exclusions && exclusions.indexOf(window.top.popups[n]) >= 0) {
                                continue;
                            }

                            var ctl = $(window.top.popups[n]);
                            if (ctl) {
                                ctl.remove();
                            }
                        }
                    }


                    window.top.popups = exclusions ? $$(".scPopup") : null;
                    if (this.onPopupClosed) {
                        this.onPopupClosed.call(this, reason);
                    }
                }
            }

            scBrowser.prototype.attachEvenstState = false;

            scBrowser.prototype.showPopupParent = function(data) {
                var id = data.id;

                var evt = (scForm.lastEvent != null ? scForm.lastEvent : event);

                this.clearEvent(evt, true, false);

                var doc = document;
                if (scForm.lastEvent != null && scForm.lastEvent.target != null) {
                    doc = scForm.lastEvent.target.ownerDocument;
                }

                var popup = parent.document.createElement("div");

                popup.id = "Popup" + (window.top.popups != null ? window.top.popups.length + 1 : 0);
                popup.className = "scPopup";
                popup.style.position = "absolute";
                popup.style.left = "0px";
                popup.style.top = "0px";
                popup.onBlur = "scForm.browser.removeChild(this.parentNode)";

                var html = "";

                if (typeof (data.value) == "string") {
                    html = data.value;
                } else {
                    html = this.getOuterHtml(data.value);

                    var p = html.indexOf(">");
                    if (p > 0) {
                        html = html.substring(0, p).replace(/display[\s]*\:[\s]*none/gi, "") + html.substr(p);
                        html = html.substring(0, p).replace(/position[\s]*\:[\s]*absolute/gi, "") + html.substr(p);
                    }
                }

                //popup.innerHTML = html;

                /*--------------added by XAContext---------------*/
                var frag = parent.document.createDocumentFragment();
                var holder = parent.document.createElement("div");
                holder.innerHTML = html;
                frag.appendChild(holder);

                var tableTr = frag.querySelectorAll("table tr"),
                    ribbonIframe = "document.getElementById('scWebEditRibbon').contentWindow",
                    nodeValue;

                for (var i = 0; i < tableTr.length; i++) {
                    for (var j = 0; j <= tableTr[i].attributes.length; j++) {
                        if (tableTr[i].attributes[j] != undefined) {
                            nodeValue = tableTr[i].attributes[j].nodeValue;
                            nodeValue = nodeValue.replace("scForm.", ribbonIframe + ".scForm.");
                            tableTr[i].attributes[j].nodeValue = nodeValue;
                        }
                    }

                    if (!tableTr[i].attributes.length) {
                        tableTr[i].className = "divider-row";
                    }
                }

                var removeOldPopUps = function(docum) {
                    var oldPopup = docum.querySelectorAll(".scPopup");
                    if (oldPopup.length) {
                        oldPopup[0].parentNode.removeChild(oldPopup[0]);
                    }
                }
                removeOldPopUps(parent.document);

                popup.appendChild(frag);
                parent.document.body.appendChild(popup);

                if (!this.attachEvenstState) {
                    var handler = function() {
                        removeOldPopUps(parent.document);
                    }

                    parent.document.body.addEventListener("click", handler);
                    document.body.addEventListener("click", handler);
                    this.attachEvenstState = true;
                }
                /*--------------- end ----------------*/

                var width = popup.offsetWidth;
                var height = popup.offsetHeight;

                var ctl = null;
                var x = evt.clientX != null ? evt.clientX : 0;
                var y = evt.clientY != null ? evt.clientY : 0;

                if (id != null && id != "") {
                    ctl = scForm.browser.getControl(id, doc);

                    if (ctl != null) {
                        ctl = $(ctl);

                        var dimensions = ctl.getDimensions();

                        if (dimensions.width > 0) {
                            switch (data.where) {
                            case "contextmenu":
                                x = evt.pageX;
                                y = evt.pageY;
                                break;

                            case "left":
                                x = -width;
                                y = 0;
                                break;

                            case "right":
                                x = dimensions.width - 3;
                                y = 0;
                                break;

                            case "above":
                                x = 0;
                                y = -height + 1;
                                break;

                            case "below-right":
                                x = dimensions.width - width;
                                y = dimensions.height;
                                break;

                            case "dropdown":
                                x = 0;
                                y = dimensions.height;
                                width = dimensions.width;
                                break;

                            default:
                                x = 0;
                                y = dimensions.height;
                            }

                            var vp = ctl.viewportOffset();
                            x += vp.left;
                            y += vp.top;
                        }
                    }
                }

                var viewport = parent.document.body;
                if (viewport.clientHeight == 0) {
                    var form = $$("form")[0];
                    if (form && form.clientHeight > 0) {
                        viewport = form;
                    }
                }

                if (x + width > viewport.clientWidth) {
                    x = parent.document.body.clientWidth - width;
                }
                if (y + height > viewport.clientHeight) {
                    y = viewport.clientHeight - height;
                }
                if (x < 0) {
                    x = 0;
                }
                if (y < 0) {
                    y = 0;
                }

                if (height > viewport.clientHeight) {
                    height = viewport.clientHeight;
                    var scrolWidth = getScrollBarWidth();
                    width += scrolWidth;
                    if (x > scrolWidth && navigator.userAgent.indexOf('Firefox') < 0) {
                        x -= scrolWidth;
                    }
                    popup.style.overflow = "auto";
                }

                popup.style.width = "" + width + "px";
                popup.style.height = "" + height + "px";
                popup.style.top = "" + y + "px";
                popup.style.left = "" + x + "px";
                popup.style.zIndex = (window.top.popups == null ? 1000 : 1000 + window.top.popups.length);

                if (window.top.popups != null) {
                    window.top.popups.push(popup);
                } else {
                    window.top.popups = new Array(popup);
                }

                var parentPopup = this.findParentPopup(evt);
                if (parentPopup) {
                    popup.scParentPopup = parentPopup;

                    var exclusions = new Array();
                    var iterator = popup;

                    while (iterator) {
                        exclusions.push(iterator);
                        iterator = $(iterator.scParentPopup);
                    }
                }

                this.closePopups("show popup", exclusions || new Array(popup));

                scForm.focus(popup);
            }

            scBrowser.prototype.showPopupLegacy = scBrowser.prototype.showPopup;

            scBrowser.prototype.showPopup = function(data) {
                if (data.id == "SnippetsList" || data.id == "DesignsList" || data.id == "ZenGardenPublish_menu_button") {
                    this.showPopupParent(data);
                } else {
                    this.showPopupLegacy(data);
                }
            }
                }
    }($xa));
}