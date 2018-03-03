if (typeof ($xa) !== "undefined") {
    $xa.toolbox = (function ($) {
        var items,
            translations,
            toolbox,
            pub = {},
            $scrolling = $('body'),
            scroller,
            scrollBy,
            ribbon = $("#scWebEditRibbon"),
            wrapper = $("#wrapper"),
            touchVersion = false;

        var gripperIcon = '<div class="gripper-icon touch-gripper">'
            + '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">'
            + '<g><rect y="144" width="512" height="32"/>'
            + '<rect y="240" width="512" height="32"/><rect y="336" width="512" height="32"/></g></svg>'
            + '</div>';

        var replaceIcons = function (iconName, items) {
            var i, l, current, icon;
            for (i = 0, l = items.length; i < l; i++) {
                current = $(items[i]);
                icon = current.data(iconName);
                if (typeof (icon) !== "undefined") {
                    current.css("background-image", "url('" + icon + "')");
                    current.css("background-repeat", "no-repeat");
                    current.css("background-position", "5px 5px");
                }
            }
        };

        var setTouch = function (isTouch, newToolbox) {
            if (typeof (newToolbox) === "undefined" && (typeof (toolbox) === "undefined" || toolbox == null)) {
                return;
            }

            if (typeof (toolbox) !== "undefined" && toolbox != null) {
                if (isTouch) {
                    toolbox.find('li li span').draggable("disable");
                }
                else {
                    toolbox.find('li li span').draggable("enable");
                }
                newToolbox = toolbox;
            }

            var items = newToolbox.find("#sxa-toolbox-root-ul li span");
            if (isTouch) {
                $(".ui-state-disabled").removeClass("ui-state-disabled");
                replaceIcons("icon24", items);
                newToolbox = newToolbox.detach();
                wrapper.before(newToolbox);
            }
            else {
                replaceIcons("icon", items);
                newToolbox = newToolbox.detach();
                wrapper.before(newToolbox);
            }

            fixPositionToBounds(newToolbox);

        };

        function getAllowedRenderings() {
            var allowedRenderings = [],
                chromes = Sitecore.PageModes.ChromeManager.chromes(),
                i, j,
                chrome;

            for (i = 0; i < chromes.length; i++) {
                chrome = chromes[i];
                if (chrome.data !== undefined && chrome.data.custom !== undefined && chrome.data.custom.allowedRenderings !== undefined) {
                    var chromeRenderings = chrome.data.custom.allowedRenderings;
                    for (j = 0; j < chromeRenderings.length; j++) {
                        if ($.inArray(chromeRenderings[j], allowedRenderings) === -1) {
                            allowedRenderings.push(chromeRenderings[j]);
                        }
                    }
                }
            }

            var renderings = [];
            chromes.filter(function (e) {
                return e.data.custom != null && e.data.custom.editable === "true" && e.data.custom.allowedRenderings != null && e.data.custom.allowedRenderings.length > 0;
            }).forEach(function (e) {
                for (var i = 0; i < e.data.custom.allowedRenderings.length; i++) {
                    var current = e.data.custom.allowedRenderings[i];
                    if (renderings.indexOf(current) >= 0) {
                        continue;
                    }
                    renderings.push(current);
                }
            });
            return renderings;
        }

        pub.loadConfiguration = function () {

            var q = '?sc_mode=edit';
            var scSite = getQueryStringParameters()["sc_site"];
            if (scSite) {
                q += '&sc_site=' + scSite;
            }

            $.ajax({
                url: '/~/sxa-toolbox/renderings-feed/' + q,
                type: "POST",
                data: {
                    allowedRenderings: JSON.stringify(getAllowedRenderings())
                },
                dataType: "json",
                success: function (data) {
                    items = data.renderings;
                    translations = data.translations;
                    refreshToolbox();
                },
                error: function (data) {
                    console.error(data);
                }
            }
            );
        };

        function getQueryStringParameters() {
            var vars = [], hash;
            var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
            for (var i = 0; i < hashes.length; i++) {
                hash = hashes[i].split('=');
                vars.push(hash[0]);
                //vars[hash[0]] = decodeURIComponent(hash[1]);
                vars[hash[0]] = hash[1];
            }
            return vars;
        };

        var refreshToolbox = function () {

            $.xaMover.refreshConfiguration();

            var newToolbox = createToolbox();

            if ($.inArray(Sitecore.PageModes.Capabilities.design, Sitecore.PageModes.PageEditor.getCapabilities()) == -1) {
                newToolbox.hide();
            }

            applyToolboxSettings(newToolbox);

            if (toolbox == null) {
                wrapper.after(newToolbox);
            } else {
                toolbox.replaceWith(newToolbox);
            }

            toolbox = newToolbox;
            fixPositionToBounds(toolbox);
            initToolboxEvents();
            toolbox.find('#sxa-toolbox-root-ul').mCustomScrollbar({
                theme: "minimal-dark"
            });
            $(document).trigger("sxa-toolbox-loaded");
        };

        var checkTouch = function () {
            var $html = $("html");

            if (('ontouchstart' in window) ||
                ('onmsgesturechange' in window) &&
                ((navigator.maxTouchPoints > 0) ||
                    (navigator.msMaxTouchPoints > 0))) {
                $html.addClass("zg-touch");
                return true;
            }
        };

        var getVisibleHeight = function () {
            return $(window).height() + $(window).scrollTop();
        };

        var fixPositionToBounds = function (toolbox) {
            //fix touch expander
            var expander;


            if (toolbox.is(".touch-version")) {
                expander = toolbox.find(".touch-expander");
            } else {
                expander = toolbox.find(".normal-expander");
            }
            expander.css("top", $(window).height() / 2 - ribbon.height() + expander.height() + "px");
            fixHeight(toolbox);
        };

        var fixHeight = function (jQToolbox) {
            var height, rootUl = jQToolbox.find("#sxa-toolbox-root-ul");
            if (jQToolbox.hasClass("touch-version")) {
                height = jQToolbox.height() - ribbon.height() - 70;
            }
            else {
                height = getVisibleHeight() - jQToolbox.offset().top - 50;
            }

            rootUl.css("height", height);
        };

        var createToolbox = function () {
            var newToolbox = $('<div id="sxa-toolbox">'),
                toolboxSettings = getCookie('sxa-toolbox');
            newToolbox.addClass('mCustomScrollbar');
            toolboxSettings = toolboxSettings.match(/[^|]+/g);

            newToolbox.html('<div class="touch-header sxa-toolbox-header">' +
                '<div class="sxa-toolbox-label">' + translations.Toolbox + '</div>'
                + '<div class="touch-btn back-to-desktop"></div>'
                + '</div><div class="touch-expander"></div><div class="normal-expander"></div>'
                + '<div class="handle sxa-toolbox-header">' + '<div class="sxa-toolbox-label">' + translations.Toolbox + '</div>' + '<div class="expand-toolbox"></div></div>');

            var searchBox = $('<input placeholder="Search controls ..." />');

            newToolbox.append($('<div id="sxa-search-box"></div>').append(searchBox));

            $('<div class="sxa-button-group"></div>').append(
                $('<button>Collapse all</button>').click(function () {
                    ulFirst.find('[id^=sxa-toolbox-section]').each(function (index, el) {
                        var $this = $(el);
                        $this.removeClass('expanded');
                        $this.parent().find('ul').slideUp("fast");
                        saveToolboxSettings();
                    });
                }),
                $('<button>Expand all</button>').click(function () {
                    ulFirst.find('[id^=sxa-toolbox-section]').each(function (index, el) {
                        var $this = $(el);
                        $this.addClass('expanded');
                        $this.parent().find('ul').slideDown("fast");
                        saveToolboxSettings();
                    });
                })).appendTo(searchBox.parent());

            var ulFirst = $('<div id="sxa-toolbox-root-ul">');
            var timeout;

            searchBox.keyup(function (e) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                }

                timeout = setTimeout(function () {
                    if (e.target.value.length && e.target.value.length > 0) {
                        ulFirst.find('[id^=sxa-toolbox-section]').each(function (index, el) {
                            var $this = $(el);

                            if (!$this.hasClass('expanded')) {
                                $this.addClass('expanded').addClass('temp-expanded');
                                $this.parent().find('ul').slideDown("fast");
                                saveToolboxSettings();
                            }
                        });
                    } else {
                        ulFirst.find('[id^=sxa-toolbox-section]').each(function (index, el) {
                            var $this = $(el);

                            if ($this.hasClass('temp-expanded')) {
                                $this.removeClass('temp-expanded');

                                if ($this.hasClass('expanded')) {
                                    $this.removeClass('expanded');
                                    $this.parent().find('ul').slideUp("fast");
                                    saveToolboxSettings();
                                }
                            }
                        });
                    }

                    ulFirst.find('.ui-draggable').each(function (index, el) {
                        var $el = $(el);
                        if ($el.text().toLowerCase().indexOf(e.target.value.toLowerCase()) > -1) {
                            $el.parent('li').show().removeClass('invalid');
                        } else {
                            $el.parent('li').hide().addClass('invalid');
                        }
                    });

                    ulFirst.find('[id^=sxa-toolbox-section]').each(function (index, el) {
                        var $this = $(el);
                        var count = 0;

                        $this.parent().find('li').each(function (n, el) {
                            if (!$(el).hasClass('invalid')) {
                                count++;
                            }
                        });

                        if (count == 0) {
                            $this.hide();
                        } else {
                            $this.show();
                        }
                    });
                }, 300);
            });

            var previousParent = '';
            var ulSecond = '';
            if (items == null) {
                return toolbox;
            }

            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if ($.inArray(item.ID, $xa.xaMover.allowedRenderings) != -1) {
                    if (previousParent != item.Parent) {
                        previousParent = item.Parent;
                        var liFirst = $('<div>');
                        liFirst.html('<span id="sxa-toolbox-section-' + item.Parent.toLowerCase().replace(/[^a-z\-]/, '') + '">' + item.Parent + '</span>');
                        ulFirst.append(liFirst);
                        ulSecond = $('<ul>');
                        liFirst.append(ulSecond);
                    }
                    var liSecond = $('<li><span data-icon="' + item.Icon + '" data-icon24="' + item.Icon24 + '" data-id="' + item.ID + '" style="background: url(' + item.Icon + ') no-repeat 5px 5px;">' + item.Name + '</span></span></div>');
                    liSecond.prepend($(gripperIcon));
                    ulSecond.append(liSecond);
                }
            }

            if (ulFirst.children().length == 0) {
                ulFirst.html('<div class="sxa-toolbox-empty">' + translations.NoRenderings + '</div>');
                newToolbox.find('.hide-toolbox').addClass('show-toolbox');
            }
            newToolbox.append(ulFirst);

            if (checkTouch()) {
                //check if toolbox mode set in cookie
                if (!toolboxSettings || toolboxSettings[4] == "true") {
                    newToolbox.addClass("touch-version");
                    setTouch(true);
                    touchVersion = true;
                }
            }
            return newToolbox;
        };

        var saveToolboxSettings = function () {
            var collapsed = toolbox.hasClass('show-toolbox') ? 0 : 1,
                left = toolbox.css('left'),
                top = toolbox.css('top'),
                sections = null;

            var expandedSpans = toolbox.find('span.expanded');
            for (var i = 0; i < expandedSpans.length; i++) {
                sections += ',' + $(expandedSpans[i]).attr('id');
            }

            if (touchVersion) {
                var toolboxSettings = getCookie('sxa-toolbox');
                toolboxSettings = toolboxSettings.match(/[^|]+/g);
                if (toolboxSettings != null) {
                    left = toolboxSettings[1];
                    top = toolboxSettings[2];
                }
            }

            document.cookie = 'sxa-toolbox=' + collapsed + '|' + left + '|' + top + '|' + sections + '|' + touchVersion;
        };

        var saveToolboxSettingsPart = function () {
            var toolboxSettings = getCookie('sxa-toolbox');

            if (toolboxSettings) {
                toolboxSettings = toolboxSettings.match(/[^|]+/g);
                if (toolboxSettings != null) {
                    document.cookie = 'sxa-toolbox=' + toolboxSettings[0] + '|' + toolboxSettings[1] + '|' + toolboxSettings[2] + '|' + toolboxSettings[3] + '|' + touchVersion;
                }
            }
        };

        var applyToolboxSettings = function (theToolbox) {
            var toolboxSettings = getCookie('sxa-toolbox');

            if (toolboxSettings) {
                toolboxSettings = toolboxSettings.match(/[^|]+/g);


                //check if collapsed
                if (parseInt(toolboxSettings[0]) === 0) {
                    theToolbox.addClass("show-toolbox");
                    theToolbox.find('.hide-toolbox').addClass('show-toolbox');
                }

                //check expanded sections
                if (toolboxSettings[3]) {
                    var expandedSections = toolboxSettings[3].match(/[^,]+/g);
                    for (var i = 0; i < expandedSections.length; i++) {
                        var section = theToolbox.find('#' + expandedSections[i]);
                        section.addClass('expanded');
                        section.parent().find('ul').show();
                    }
                }

                //check mode (touch/normal)
                if (toolboxSettings[4] == "true") {
                    touchVersion = true;
                    $("html").addClass("zg-touch");
                    theToolbox.addClass("touch-version");
                    setTouch(true);
                } else {
                    $("html").removeClass("zg-touch");
                }

                setTouch(touchVersion, theToolbox);

            }

        };

        var checkWrapperPosition = function () {
            if (toolbox.width() + $("#wrapper").width() < $(window).width()) {
                toolbox.addClass("toolbox-wrapper-half");
            } else {
                toolbox.removeClass("toolbox-wrapper-half");
            }
        };

        var toggleToolboLock = false;

        var initToolboxEvents = function () {
            var handle = toolbox.find(".handle"),
                ribbonSwitcher = ribbon.contents().find("nav > [data-sc-id='QuickRibbon']") || ribbon.contents().find(".sc-quickbar-item.sc-quickbar-button.sc_QuickbarButton_56");


            window.addEventListener('resize', function () {
                fixPositionToBounds(toolbox);
            });


            ribbonSwitcher.on("click", function () {
                fixPositionToBounds(toolbox);
            });

            toolbox.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
                Sitecore.PageModes.ChromeHighlightManager.highlightChromes();
            });

            var toggleToolboxShow = function () {
                if (toggleToolboLock) {
                    return;
                }
                toggleToolboLock = true;
                checkWrapperPosition();
                $(this).toggleClass('show-toolbox');
                toolbox.toggleClass('show-toolbox');
                fixHeight(toolbox);
                saveToolboxSettings();

                function func() {
                    toggleToolboLock = false;;
                }
                setTimeout(func, 10);
            };

            toolbox.find('.hide-toolbox').on("click", function () {
                toggleToolboxShow();
            });

            toolbox.find('.normal-expander').on("click", function () {
                toggleToolboxShow();
            });

            toolbox.find(".touch-expander").on("click touchstart pointerdown MSPointerDown", function () {
                toggleToolboxShow();
            });

            toolbox.find('#sxa-toolbox-root-ul div span').click(function () {
                $(this).toggleClass('expanded');
                $(this).parent().find('ul').slideToggle("fast");
                saveToolboxSettings();
            });

            var toggleToolboxTouch = function () {
                if (toggleToolboLock) {
                    return;
                }
                toggleToolboLock = true;
                toolbox.toggleClass("touch-version");
                setTouch(toolbox.is("touch-version"));
                touchVersion = !touchVersion;
                fixHeight(toolbox);
                saveToolboxSettingsPart();
                applyToolboxSettings(toolbox);
                fixPositionToBounds(toolbox);
                function func() {
                    toggleToolboLock = false;;
                }
                setTimeout(func, 100);
            };

            toolbox.find(".back-to-desktop").on("click touchstart pointerdown MSPointerDown", function (args) {
                args.preventDefault();
                toolbox.removeClass("touch-version");
                setTouch(toolbox.is("touch-version"));
                touchVersion = false;
                fixHeight(toolbox);
                saveToolboxSettingsPart();
                applyToolboxSettings(toolbox);
            });

            toolbox.find(".expand-toolbox").on("click touchstart pointerdown MSPointerDown", function () {
                toggleToolboxTouch();
            });

            var handler = function (eventStart) {
                var posX,
                    posXEnd;

                if (eventStart.originalEvent.hasOwnProperty("touches")) {
                    posX = eventStart.originalEvent.touches[0].pageX;
                } else {
                    posX = eventStart.originalEvent.pageX;
                }

                $scrolling.unbind(".ev3");
                $scrolling.on("touchend.ev3 pointerup.ev3 MSPointerUp.ev3", function (eventEnd) {
                    if (touchVersion) {
                        if (eventEnd.originalEvent.hasOwnProperty("changedTouches")) {
                            posXEnd = eventEnd.originalEvent.changedTouches[0].pageX;
                        } else {
                            posXEnd = eventEnd.originalEvent.pageX;
                        }

                        if ((posX < 20) && (posX < posXEnd)) {
                            if (!toolbox.hasClass("show-toolbox")) {
                                toolbox.addClass('show-toolbox');
                                saveToolboxSettings();
                            }
                        }
                    }
                });
            };

            $scrolling.on("touchstart", handler);
            handle.on("pointerdown MSPointerDow", handler);
            var cachedDraggable;
            var dragger = {
                opacity: 0.7,
                scroll: true,
                helper: "clone",
                containment: 'html',
                appendTo: '#wrapper',
                cursorAt: { top: -20, left: 20 },
                refreshPositions: true,
                start: function () {
                    $('.ui-draggable-dragging').addClass('toolbox-item');
                    if (touchVersion) {
                        $('.ui-draggable-dragging').addClass('touch-draggable');
                    }
                    $.xaMover.prepareDroppablePlaceholders($(this), toolbox);

                    cachedDraggable = $(".ui-draggable-dragging");
                    cachedDraggable.refreshCounter = 0;
                },
                stop: function () {
                    setTimeout(function () {
                        $.xaMover.clearDroppablePlaceholders();
                    }, 50);
                }
            };

            toolbox.find('#sxa-toolbox-root-ul li span').draggable(dragger);

            //dragger for touch gripper
            var touchDragger = $.extend({}, dragger);
            touchDragger.helper = function () {
                var self = $(this);
                var helper = self.siblings("span");
                self.data("id", helper.data("id"));
                return helper.clone();
            };
            touchDragger.start = function () {
                var helper = $(this).siblings("span");
                dragger.start.call(helper[0]);
            };
            toolbox.find(".touch-gripper").draggable(touchDragger);
            setTouch(touchVersion);
        };

        //extends jQuery.xaMover.cleanup
        var cleanup = function () {
            setTimeout(function () {
                pub.loadConfiguration();
            }, 1);
        };

        var getCookie = function (cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i].trim();
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        };

        pub.init = function () {
            if (toolbox == null) {
                if (typeof Sitecore === "undefined" || typeof $(document).draggable === "undefined" || typeof ($.xaMover) === "undefined")
                    return;

                pub.loadConfiguration();
                Sitecore.PageModes.ChromeManager.chromesReseted.observe($sc.proxy(function () {
                    cleanup();
                }));
            }
        };

        pub.remove = function () {
            toolbox = null;
            $('#sxa-toolbox').unbind().remove();
        };

        pub.handleResponse = function (message, result) {
            if (message != 'chrome:placeholder:controladdingcancelled') {
                $.xaMover.currentChrome.type.addControlResponse(result.id, result.openProperties, result.dataSource);
            } else {
                $.xaMover.cleanup();
                cleanup();
            }
        };

        return pub;
    }($xa));
}