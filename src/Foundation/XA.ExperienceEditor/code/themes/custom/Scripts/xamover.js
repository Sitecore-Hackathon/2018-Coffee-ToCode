var SXA;
(function (SXA) {
    var SxaMover = (function () {
        function SxaMover(sxaJquery) {
            this.allowedRenderings = [];
            this.notifyPlaceholdersPositions = {};
            this.notifyBoxPositions = {};
            this.droppablePlaceholders = {};
            this.placeholders = {};
            this.droppablePlaceholders = [];
            this.isToolboxDrop = false;
            this.mouseManager = new MouseManager();
            this.init();
            this.$ = sxaJquery;
        }
        SxaMover.prototype.getOpenedPlaceholdersCount = function () {
            var _this = this;
            var openedPlaceholders = this.$('.scpm[chrometype="placeholder"][kind="open"]'), count = 0;
            openedPlaceholders.each(function (index, elment) {
                var $openCode = _this.$(elment), key = $openCode.attr('key'), chromeKey, chrome, i;
                if ($openCode.siblings('.scEmptyPlaceholder[sc-placeholder-id="' + $openCode.attr("id") + "\"]").length !== 0) {
                    count++;
                    return;
                }
                for (i = 0; i < _this.chromes.length; i++) {
                    chrome = _this.chromes[i];
                    if (chrome._originalDOMElement.length > 0) {
                        chromeKey = chrome._originalDOMElement[0].attributes["key"];
                        if (chromeKey !== undefined &&
                            chromeKey !== null &&
                            chromeKey.value === key &&
                            chrome.data !== undefined &&
                            chrome.data.custom !== undefined &&
                            chrome.data.custom.editable === "true") {
                            count++;
                        }
                    }
                }
            });
            return count;
        };
        SxaMover.prototype.cleanup = function () {
            this.$(".sxa-toolbox-div.toolbox-dropping").remove();
            this.$(".sxa-toolbox-droppable").removeClass("sxa-toolbox-droppable");
            this.$(".toolbox-dropping").removeClass("toolbox-dropping");
            this.$(".zg-height-fix").removeClass("zg-height-fix");
            this.$(".sxa-disabled-placeholder").removeClass("sxa-disabled-placeholder");
            this.$(".zg-delightful-droppable").remove();
            this.$(".notify-box").remove();
            this.currentChrome = null;
            Sitecore.PageModes.ChromeHighlightManager.highlightChromes();
            Sitecore.PageModes.ChromeHighlightManager.planUpdate();
        };
        SxaMover.prototype.prepareDroppablePlaceholders = function (rendering, invoker) {
            var _this = this;
            var openedPlaceholders = this.$(".scpm[chrometype=\"placeholder\"][kind=\"open\"]"), placeholdersRenderings = this.getPlaceholdersRenderings(), isMovingComponent = rendering.data("moving") !== undefined, check = rendering.data("getPlaceholderPositionChange") || (function (o, m, g) { return (-1); }), componentPlaceholder;
            if (rendering.data("component") !== undefined) {
                componentPlaceholder = this.$(rendering.data("component").type.getPlaceholder().openingMarker()).attr("key");
            }
            openedPlaceholders.each(function (index, element) {
                var ph = _this.$(element), placeholderRenderings = placeholdersRenderings.filter(function (phr) { return (phr.name === ph.attr("key")); });
                if (placeholdersRenderings.length > 0) {
                    var dstPh = ph[0].attributes['key'].value;
                    var srcPh = componentPlaceholder;
                    var phValidator = new SXA.Feature.Composites.CompositePlaceholderValidator();
                    if (srcPh == null || phValidator.validate(dstPh, srcPh)) {
                        _this.createPlaceholders.call(_this, ph, rendering, componentPlaceholder, check, isMovingComponent, placeholderRenderings[0]);
                    }
                }
            });
            if (typeof invoker !== "undefined") {
                document.body.click();
                invoker.droppable({
                    drop: function () {
                        _this.isToolboxDrop = true;
                    }
                });
            }
            var dropPlaces = this.getPossibleDropPlaces();
            for (var i = 0; i < dropPlaces.length; i++) {
                var elemen = dropPlaces[i];
                while (elemen.attributes['key'] == null) {
                    elemen = elemen.previousElementSibling;
                }
                var dstPh = elemen.attributes['key'].value;
                var srcPh = componentPlaceholder;
                var phValidator = new SXA.Feature.Composites.CompositePlaceholderValidator();
                if (srcPh == null || phValidator.validate(dstPh, srcPh)) {
                    this.initializeDrapability.call(this, this.$(dropPlaces[i]), rendering, componentPlaceholder, isMovingComponent);
                }
            }
            this.$(".scEmptyPlaceholder.ui-droppable.sxa-toolbox-droppable").each(function (index, elem) {
                var $elem = _this.$(elem);
                if ($elem.prevAll("code").attr("id") === $elem.attr("sc-placeholder-id")) {
                    $elem.html(_this.$(elem).prevAll("code").attr("key"));
                }
            });
            Sitecore.PageModes.ChromeHighlightManager.highlightChromes();
        };
        SxaMover.prototype.clearDroppablePlaceholders = function () {
            var i;
            for (i = 0; i < this.droppablePlaceholders.length; i++) {
                if (!this.droppablePlaceholders[i].hasClass("toolbox-dropping")) {
                    this.droppablePlaceholders[i].remove();
                }
            }
            this.droppablePlaceholders = [];
            this.$(".sxa-toolbox-div.ui-droppable,.scEmptyPlaceholder.sxa-toolbox-droppable").not(".toolbox-dropping").removeClass("sxa-toolbox-droppable").html("");
            this.$(".zg-height-fix").removeClass("zg-height-fix");
            this.$(".sxa-disabled-placeholder").removeClass("sxa-disabled-placeholder");
            this.$(".notify-box").remove();
            this.mouseManager.stopTracking();
            this.notifyPlaceholdersPositions = {};
            this.notifyBoxPositions = {};
            this.$(".zg-delightful-droppable-image").attr("left", "-23px");
            Sitecore.PageModes.ChromeHighlightManager.highlightChromes();
        };
        SxaMover.prototype.refreshConfiguration = function () {
            var i, j, chrome, chromeKey;
            this.allowedRenderings = [];
            this.placeholders = {};
            this.chromes = Sitecore.PageModes.ChromeManager.chromes();
            for (i = 0; i < this.chromes.length; i++) {
                chrome = this.chromes[i];
                if (chrome.data !== undefined && chrome.data.custom !== undefined && chrome.data.custom.allowedRenderings !== undefined) {
                    var chromeRenderings = chrome.data.custom.allowedRenderings;
                    for (j = 0; j < chromeRenderings.length; j++) {
                        if (this.$.inArray(chromeRenderings[j], this.allowedRenderings) === -1) {
                            this.allowedRenderings.push(chromeRenderings[j]);
                        }
                    }
                    if (chrome._originalDOMElement.length > 0) {
                        chromeKey = chrome._originalDOMElement[0].attributes["key"];
                        if (chromeKey !== undefined && chromeKey !== null) {
                            this.placeholders[chromeKey.value] = chromeRenderings;
                        }
                    }
                }
            }
        };
        SxaMover.prototype.getCurrentChrome = function () {
            return this.currentChrome;
        };
        SxaMover.prototype.getAllowedRenderings = function () {
            return this.allowedRenderings;
        };
        SxaMover.prototype.initMoveComponentPlugIn = function () {
            var self = this, sitecoreSorting, scInsertSortingHandle, sxaInsertSortingHandle, scSortingHandler;
            if (typeof (Sitecore) === "undefined") {
                return;
            }
            sitecoreSorting = Sitecore.PageModes.ChromeTypes.PlaceholderSorting.prototype;
            scInsertSortingHandle = sitecoreSorting.insertSortingHandle;
            sxaInsertSortingHandle = function (where, chrome, insertPosition, positionCount) {
                var clickHandlers, lastHandler, bindEvent;
                scSortingHandler = this;
                scInsertSortingHandle.call(scSortingHandler, where, chrome, insertPosition, positionCount);
                clickHandlers = scSortingHandler.handles.splice(0);
                lastHandler = $sc(clickHandlers[clickHandlers.length - 1]);
                lastHandler.unbind("click");
                bindEvent = function (p) {
                    var position = function () { return p; }();
                    lastHandler.click($sc.proxy(function (e) {
                        var componentTree = self.getComponentTree(this.rendering), component = this.rendering;
                        e.stop();
                        Sitecore.PageModes.DesignManager.sortingEnd();
                        Sitecore.PageModes.DesignManager.moveControlTo(component, this.placeholder, position);
                        self.moveComponentTree(component, componentTree);
                        self.postMoveActions(component);
                    }, scSortingHandler));
                };
                bindEvent(insertPosition);
                scSortingHandler.handles = clickHandlers;
            };
            try {
                sitecoreSorting.insertSortingHandle = sxaInsertSortingHandle;
            }
            catch (e) {
                console.log(e);
            }
        };
        SxaMover.prototype.initDeleteComponentPlugIn = function () {
            var _this = this;
            var self = this, sitecoreRendering = Sitecore.PageModes.ChromeTypes.Rendering.prototype, sitecoreDeleteControl = sitecoreRendering.deleteControl, cssClass = "zg-cascade-delete", setStyleVisible = function (visible, htmlElements) {
                var toStyle = _this.$(htmlElements).filter(".scEnabledChrome");
                if (visible) {
                    toStyle.addClass(cssClass);
                }
                else {
                    toStyle.removeClass(cssClass);
                }
            }, doesUserConfirmCascadeDelete = function (componentTree) {
                var message = "This operation will delete the following nested components:\n", current, i;
                for (i = 0; i < componentTree.bfs.length; i++) {
                    current = componentTree.bfs[i];
                    message += "\u00B7 " + current.node._displayName + "\n";
                }
                return confirm(message);
            }, deleteNestedComponents = function (componentTree) {
                var current, context, i;
                for (i = componentTree.bfs.length - 1; i >= 0; i--) {
                    current = componentTree.bfs[i].node;
                    context = current.type;
                    sitecoreDeleteControl.call(context, current.type.chrome);
                }
            }, zgDeleteControl = function () {
                var context = this, component = context.chrome, htmlElements, componentTree = self.getComponentTree(component);
                if (componentTree.bfs.length !== 1) {
                    htmlElements = componentTree.node.element;
                    setStyleVisible(true, htmlElements);
                    if (doesUserConfirmCascadeDelete(componentTree)) {
                        deleteNestedComponents(componentTree);
                    }
                    setStyleVisible(false, htmlElements);
                }
                else {
                    sitecoreDeleteControl.call(context, component);
                }
            };
            if (typeof (Sitecore) === "undefined") {
                return;
            }
            try {
                sitecoreRendering.deleteControl = zgDeleteControl;
            }
            catch (e) {
                console.log(e);
            }
        };
        SxaMover.prototype.initTouchDragNDropPlugIn = function () {
            !function (a) {
                function f(a, b) {
                    if (!(a.originalEvent.touches.length > 1)) {
                        a.preventDefault();
                        var c = a.originalEvent.changedTouches[0], d = document.createEvent("MouseEvents");
                        d.initMouseEvent(b, !0, !0, window, 1, c.screenX, c.screenY, c.clientX, c.clientY, !1, !1, !1, !1, 0, null), a.target.dispatchEvent(d);
                    }
                }
                if (a.support.touch = "ontouchend" in document, a.support.touch) {
                    var e, b = a.ui.mouse.prototype, c = b._mouseInit, d = b._mouseDestroy;
                    b._touchStart = function (a) {
                        var b = this;
                        !e && b._mouseCapture(a.originalEvent.changedTouches[0]) && (e = !0, b._touchMoved = !1, f(a, "mouseover"), f(a, "mousemove"), f(a, "mousedown"));
                    }, b._touchMove = function (a) { e && (this._touchMoved = !0, f(a, "mousemove")); }, b._touchEnd = function (a) { e && (f(a, "mouseup"), f(a, "mouseout"), this._touchMoved || f(a, "click"), e = !1); }, b._mouseInit = function () {
                        var b = this;
                        b.element.bind({ touchstart: a.proxy(b, "_touchStart"), touchmove: a.proxy(b, "_touchMove"), touchend: a.proxy(b, "_touchEnd") }), c.call(b);
                    }, b._mouseDestroy = function () {
                        var b = this;
                        b.element.unbind({ touchstart: a.proxy(b, "_touchStart"), touchmove: a.proxy(b, "_touchMove"), touchend: a.proxy(b, "_touchEnd") }), d.call(b);
                    };
                }
            }(this.$);
        };
        SxaMover.prototype.init = function () {
            var _this = this;
            if (typeof (Sitecore) === "undefined") {
                return;
            }
            Sitecore.PageModes.ChromeManager.chromesReseted.observe($sc.proxy(function () {
                _this.cleanup();
            }));
        };
        SxaMover.prototype.getPossibleDropPlaces = function () {
            var _this = this;
            var dropPlaces = this.$(".sxa-toolbox-div,.scEmptyPlaceholder").not(".ui-droppable").toArray();
            dropPlaces.sort(function (first, second) {
                var firstKey = _this.$(first).find(".zg-delightful-droppable").attr("key"), secondKey = _this.$(second).find(".zg-delightful-droppable").attr("key");
                if (typeof firstKey === "undefined") {
                    firstKey = _this.$(first).prevAll("code").attr("key");
                }
                if (typeof secondKey === "undefined") {
                    secondKey = _this.$(second).prevAll("code").attr("key");
                }
                return _this.countSlashes(firstKey) - _this.countSlashes(secondKey);
            });
            return dropPlaces;
        };
        SxaMover.prototype.countSlashes = function (ph) {
            return (ph.match(/\//g) || []).length;
        };
        SxaMover.prototype.createPlaceholderHtmlElement = function (placeholder, plhId, disabled) {
            if (disabled === void 0) { disabled = true; }
            var dropPlace = this.$("<div class=\"zg-delightful-droppable\" key=\"" + plhId + "\" style=\"width: " + placeholder.css("width") + "; visibility: hidden\">" +
                "<div class=\"inner\"></div>" +
                "</div>");
            if (disabled) {
                placeholder.append(dropPlace);
            }
            placeholder.addClass("sxa-toolbox-droppable");
            if (!placeholder.hasClass("sxa-toolbox-div")) {
                placeholder.css("width", placeholder.parent().css("width"));
            }
            if (placeholder.hasClass("scEmptyPlaceholder")) {
                placeholder.parent().addClass("zg-height-fix");
            }
            if (!disabled) {
                placeholder.parent().addClass("sxa-disabled-placeholder");
            }
        };
        SxaMover.prototype.initializeDrapability = function (placeholder, rendering, componentPlaceholder, isMovingComponent) {
            var plhId = placeholder.attr("sc-placeholder-id"), self = this;
            if (placeholder.prevAll("code").attr("id") === plhId) {
                plhId = placeholder.prevAll("code").attr("key");
            }
            if (isMovingComponent && rendering.data("isPlaceholderNestedInsideComponent")(componentPlaceholder, plhId, rendering)) {
                return;
            }
            if (this.$.inArray(rendering.data("id"), this.placeholders[plhId]) !== -1) {
                if (placeholder.children(".zg-delightful-droppable").length === 0) {
                    this.createPlaceholderHtmlElement(placeholder, plhId);
                }
                placeholder.find(".zg-delightful-droppable, .zg-delightful-droppable-image").not(".inner").droppable({
                    tolerance: "pointer",
                    out: function (event, ui) {
                        if (self.$(this).hasClass("zg-delightful-droppable-image") || self.$(this).parent().hasClass("scEmptyPlaceholder")) {
                            self.notifyDropPlace.call(self, true, self.$(this));
                        }
                    },
                    over: function (event, ui) {
                        var _this = this;
                        setTimeout(function () {
                            if (self.$(_this).hasClass("zg-delightful-droppable-image") || self.$(_this).parent().hasClass("scEmptyPlaceholder")) {
                                self.notifyDropPlace.call(self, false, self.$(_this));
                            }
                        }, 50);
                    },
                    drop: function (event, ui) {
                        self.placeholderDrop(rendering, plhId, ui, self.$(this).parent());
                    }
                });
                self.handleImageMouseMoves.call(self, placeholder);
                self.handleEmptyPlaceholders(placeholder);
            }
            else {
                this.createPlaceholderHtmlElement(placeholder, plhId, false);
            }
        };
        SxaMover.prototype.handleImageMouseMoves = function (placeholder) {
            var self = this;
            placeholder.find(".zg-delightful-droppable-image").mouseover(function (event) {
                var $currentElement = self.$(event.currentTarget);
                if ($currentElement.attr("position")) {
                    self.$(".zg-delightful-droppable[key='" + $currentElement.attr("key") + "'][position=" + $currentElement.attr("position") + "]").addClass("hovered");
                }
                else {
                    self.$(".zg-delightful-droppable[key='" + $currentElement.attr("key") + "']").addClass("hovered");
                }
                $currentElement.addClass("hovered-icon");
            }).mouseout(function (event) {
                var $currentElement = self.$(event.currentTarget);
                if ($currentElement.attr("position")) {
                    self.$(".zg-delightful-droppable[key='" + $currentElement.attr("key") + "'][position=" + $currentElement.attr("position") + "]").removeClass("hovered");
                }
                else {
                    self.$(".zg-delightful-droppable[key='" + $currentElement.attr("key") + "']").removeClass("hovered");
                }
                $currentElement.removeClass("hovered-icon");
                $currentElement.children().remove();
            });
        };
        SxaMover.prototype.handleEmptyPlaceholders = function (placeholder) {
            var self = this;
            if (placeholder.hasClass("scEmptyPlaceholder")) {
                placeholder.mouseover(function (event) {
                    self.$(event.currentTarget).find(".zg-delightful-droppable").addClass("hovered").css("visibility", "visible");
                }).mouseout(function (event) {
                    if (!event.currentTarget.classList.contains("toolbox-dropping")) {
                        self.$(event.currentTarget).find(".zg-delightful-droppable").css("visibility", "hidden");
                    }
                });
            }
        };
        SxaMover.prototype.placeholderDrop = function (rendering, plhId, ui, placeholder) {
            if (rendering.data("moving") !== undefined) {
                return this.moveComponent(plhId, rendering, placeholder);
            }
            else {
                return this.dropComponent(ui, placeholder);
            }
        };
        SxaMover.prototype.createPlaceholders = function ($openCode, rendering, componentPlaceholder, check, isMovingComponent, placeholderData) {
            var _this = this;
            var key = $openCode.attr("key"), opened = false, $sibling = null, k, position = 0, renderings, allSiblings, allRenderings, positionChange;
            if (!this.shouldCreatePlaceholder(rendering, $openCode)) {
                return;
            }
            allSiblings = $openCode.nextAll(":not([chrometype='field'])");
            allRenderings = $openCode.siblings("div.component,div.json-component-wrapper");
            if (isMovingComponent && rendering.data("isPlaceholderNestedInsideComponent")(componentPlaceholder, key, rendering)) {
                return;
            }
            if (allRenderings.length > 0) {
                renderings = placeholderData.renderings;
                if (renderings.length <= 1 && isMovingComponent && componentPlaceholder === placeholderData.name) {
                    return;
                }
                for (k = 0; k < renderings.length; k++) {
                    positionChange = check(rendering, k, allSiblings);
                    this.createDroppableGridPlaceholder(this.$(renderings[k]), true, position, placeholderData.name);
                    position++;
                    if (k === renderings.length - 1) {
                        this.createDroppableGridPlaceholder(this.$(renderings[k]), false, position, placeholderData.name);
                    }
                }
            }
            else {
                for (k = 0; k < allSiblings.length; k++) {
                    $sibling = this.$(allSiblings[k]);
                    positionChange = check(rendering, k, allSiblings);
                    if (isMovingComponent && positionChange >= 0) {
                        position += positionChange;
                        continue;
                    }
                    if ($sibling.prop("tagName") !== "CODE") {
                        if (opened) {
                            continue;
                        }
                        this.createDroppablePlaceholder($sibling, true, position, key);
                        position++;
                    }
                    else {
                        if ($sibling.attr("kind") === "open") {
                            opened = true;
                            this.createDroppablePlaceholder($sibling, true, position, key);
                            position++;
                        }
                        if ($sibling.attr("kind") === "close") {
                            if ($sibling.attr("key") !== key) {
                                opened = false;
                            }
                            else {
                                break;
                            }
                        }
                    }
                }
                var condition = allSiblings.filter(function (idx, e) { return (_this.$(e).attr("kind") === "open"); }).length;
                if (position > 0 && condition !== position - 1) {
                    this.createDroppablePlaceholder($sibling, false, position, key);
                }
            }
        };
        SxaMover.prototype.createDroppablePlaceholder = function ($sibling, before, position, placeholderKey) {
            var $div = this.$("<div class=\"sxa-toolbox-div\" sc-placeholder-id=\"" + placeholderKey + "\" position=\"" + position + "\" >" +
                "<div class='zg-delightful-droppable-image' position=\"" + position + "\" key=\"" + placeholderKey + "\"></div>" +
                "<div class=\"zg-delightful-droppable\" position=\"" + position + "\" key=\"" + placeholderKey + "\"><div class=\"inner\"></div></div>" +
                "</div>");
            $div.width($sibling.parent().width());
            this.dropPlaceholder(before, $div, $sibling);
        };
        SxaMover.prototype.createDroppableGridPlaceholder = function ($sibling, before, position, placeholderKey) {
            var $div = this.$("<div class=\"sxa-toolbox-div\" sc-placeholder-id=\"" + placeholderKey + "\" position=\"" + position + "\" >" +
                "<div class='zg-delightful-droppable-image' position=\"" + position + "\" key=\"" + placeholderKey + "\"></div>" +
                "<div class=\"zg-delightful-droppable\" position=\"" + position + "\" key=\"" + placeholderKey + "\"><div class=\"inner\"></div></div>" +
                "</div>"), renderingPosition = $sibling.position(), outerHeight = $sibling.outerHeight();
            if (outerHeight < 20) {
                outerHeight += 8;
            }
            $div.css({
                width: $sibling.outerWidth(),
                "position": "absolute",
                top: before ? renderingPosition.top : (renderingPosition.top + outerHeight),
                left: renderingPosition.left
            });
            if (!before) {
                $div.find(".zg-delightful-droppable-image").addClass("rotated");
            }
            this.dropPlaceholder(before, $div, $sibling);
        };
        SxaMover.prototype.dropComponent = function (ui, $plh) {
            var $plh, plhId, chrome, i;
            if (this.isToolboxDrop) {
                this.isToolboxDrop = false;
                return;
            }
            if (this.currentChrome !== null) {
                return;
            }
            $plh.addClass("toolbox-dropping");
            plhId = $plh.attr("sc-placeholder-id");
            if ($plh.prevAll("code").attr("id") === plhId) {
                plhId = $plh.prevAll("code").attr("key");
            }
            for (i = 0; i < this.chromes.length; i++) {
                chrome = this.chromes[i];
                if (chrome._originalDOMElement.length > 0) {
                    var key = chrome._originalDOMElement[0].attributes["key"];
                    if (key !== undefined && key !== null && key.value === plhId) {
                        this.currentChrome = chrome;
                        if ($plh.attr("position")) {
                            chrome.type._insertPosition = $plh.attr("position");
                        }
                        else {
                            chrome.type._insertPosition = 0;
                        }
                        Sitecore.PageModes.PageEditor.layoutDefinitionControl().value = Sitecore.PageModes.PageEditor.layout().val();
                        Sitecore.PageModes.PageEditor.postRequest("webedit:addrendering(placeholder=" + plhId + ",toolboxRendering=" + ui.draggable.data("id") + ")");
                        return;
                    }
                }
            }
        };
        SxaMover.prototype.moveComponent = function (placeholderId, rendering, placeholder) {
            var self = this;
            return function () {
                var placeHldr, position, component, tree, deviceId, sitecoreChrome, renderingUid;
                try {
                    component = rendering.data("component");
                    placeHldr = self.getPlaceholderFromId(placeholderId);
                    if (placeHldr.length < 1) {
                        throw "Cannot find placeholder";
                    }
                    else if (placeHldr.length > 1) {
                        console.log("Warning! You have two placeholders with the same path on the page!");
                    }
                    position = placeholder.attr("position") || 0;
                    if (!rendering.data("isPositionChanged")(component, position, placeholderId)) {
                        return;
                    }
                    tree = rendering.data("tree");
                    Sitecore.PageModes.DesignManager.moveControlTo(component, placeHldr[0], position);
                    self.moveComponentTree(component, tree);
                    self.postMoveActions(component);
                    deviceId = Sitecore.LayoutDefinition.getDeviceID();
                    sitecoreChrome = Sitecore.PageModes.ChromeManager.selectedChrome();
                    renderingUid = sitecoreChrome.type.uniqueId();
                    Sitecore.PageModes.PageEditor.postRequest("webedit:updatelayout(deviceId=" + deviceId + ",renderingUid=" + renderingUid + ")", null, false);
                }
                catch (e) {
                    console.log(e);
                }
            }();
        };
        SxaMover.prototype.moveComponentTree = function (component, tree) {
            var c, current, newRootPlaceholder, newPlaceholder, oldPlaceholder, layoutDefinition, processedPlaceholders = {};
            tree = tree.bfs;
            if (tree.length === 1) {
                return;
            }
            oldPlaceholder = tree[0].placeholder;
            newRootPlaceholder = this.getPlaceholderFullPath(tree[0].node);
            layoutDefinition = Sitecore.LayoutDefinition.getLayoutDefinition();
            for (c = 1; c < tree.length; c++) {
                current = tree[c];
                if (current.node.type.key() !== "rendering") {
                    continue;
                }
                newPlaceholder = current.placeholder.replace(oldPlaceholder, newRootPlaceholder);
                this.updateLayoutDefinition(current.node, newPlaceholder, layoutDefinition);
                this.updatePlaceholder(this.getPlaceholderFullPath(current.node), newPlaceholder, processedPlaceholders);
            }
            Sitecore.LayoutDefinition.setLayoutDefinition(layoutDefinition);
        };
        SxaMover.prototype.getComponentTree = function (component) {
            var queue = [], root, current, c, ph, children, placeholdersBelowRoot = [], node, bfs = [], isComponent = function (node) { return (node.type.key() === "rendering"); }, isPlaceholder = function (node) { return (node.type.key() === "placeholder"); }, getFullPlaceholderPath = function (parent, current) {
                if (current.type.getPlaceholder !== undefined) {
                    return parent.placeholder + "/" + current.type.getPlaceholder().displayName();
                }
                else {
                    return parent.placeholder;
                }
            }, getPositionInPlaceholder = function (current) {
                if (current.type.getPlaceholder !== undefined) {
                    return Sitecore.LayoutDefinition.getRenderingPositionInPlaceholder(current.type.getPlaceholder().displayName(), current.type.uniqueId());
                }
                return -1;
            };
            root = { parent: null, node: component, placeholder: component.type.getPlaceholder().openingMarker().attr("key"), position: 0 };
            queue.push(root);
            bfs.push(root);
            while (queue.length > 0) {
                current = queue.shift();
                current.children = [];
                children = current.node.getChildChromes();
                for (c = 0; c < children.length; c++) {
                    if (children[c] !== current.node && isComponent(children[c])) {
                        node = {
                            parent: current,
                            node: children[c],
                            placeholder: getFullPlaceholderPath(current, children[c]),
                            position: getPositionInPlaceholder(children[c])
                        };
                        queue.push(node);
                        current.children.push(node);
                        bfs.push(node);
                    }
                    else if (isPlaceholder(children[c])) {
                        ph = (current.placeholder)[0] === "/" ? current.placeholder : "/" + current.placeholder;
                        ph += "/" + children[c].displayName();
                        placeholdersBelowRoot.push(ph);
                        queue.push({ node: children[c], placeholder: current.placeholder });
                    }
                }
            }
            root.bfs = bfs;
            root.descendantPlaceholders = placeholdersBelowRoot;
            return root;
        };
        SxaMover.prototype.updatePlaceholder = function (oldPlaceholder, newPlaceholder, processedPlaceholders) {
            var placeholder;
            if (!processedPlaceholders.hasOwnProperty(oldPlaceholder)) {
                placeholder = this.$(this.getPlaceholderFromId(oldPlaceholder)[0].openingMarker());
                placeholder.attr("key", newPlaceholder);
                placeholder.attr("id", newPlaceholder.replace(/\//g, "_").replace(/-/g, "_"));
                processedPlaceholders[oldPlaceholder] = newPlaceholder;
            }
        };
        SxaMover.prototype.updateLayoutDefinition = function (component, newPlaceholder, layoutDefinition) {
            var uid = component.type.uniqueId(), rendering;
            rendering = this.$.grep(layoutDefinition.r.d[0].r, function (element, idx) { return (Sitecore.LayoutDefinition.getShortID(element["@uid"]) === uid); });
            if (rendering.length === 1) {
                rendering = rendering[0];
                rendering["@ph"] = newPlaceholder;
            }
        };
        SxaMover.prototype.dropPlaceholder = function (before, $div, $sibling) {
            if ($div.width() === 0 && $sibling.parent().is("span")) {
                $div.width("100%");
                $div.height(20);
            }
            $div.css("visibility", "hidden");
            if (before) {
                $sibling.before($div);
            }
            else {
                $sibling.after($div);
            }
            this.droppablePlaceholders.push($div);
            this.mouseManager.trackDropPlace($div.find(".zg-delightful-droppable-image"));
        };
        SxaMover.prototype.notifyDropPlace = function (isVisible, placeholder) {
            var placeholderText, placeholder, position, old, $wrapper = this.$("#wrapper"), notifyBox, notifyIcon, notifyText;
            placeholderText = placeholder.attr("key");
            if (placeholder.attr("position")) {
                position = parseInt(placeholder.attr("position")) + 1;
                placeholderText += " (" + position + ")";
            }
            old = $wrapper.find(".notify-box");
            old.remove();
            notifyBox = this.$("<div />");
            notifyIcon = this.$("<span />").addClass("notify-icon");
            notifyText = this.$("<span />").addClass("notify-text");
            notifyBox.addClass("notify-box");
            if (this.$(".touch-version").length !== 0) {
                notifyBox.addClass("touch-version");
            }
            if (!$wrapper.find(".notify-box").length) {
                $wrapper.prepend(notifyBox);
            }
            if (!isVisible) {
                notifyBox.addClass("visible");
                notifyBox.append(notifyIcon).append(notifyText);
                notifyText.text(placeholderText);
            }
            else {
                notifyBox.removeClass("visible");
            }
            this.updateNotifyBoxPosition(notifyBox, placeholder);
        };
        SxaMover.prototype.updateNotifyBoxPosition = function (notifyBox, placeholder) {
            var image = placeholder.parent().find(".zg-delightful-droppable-image"), notifyBoxRect, placeholderRect, key;
            if (image.length > 0) {
                key = image.attr("key") + "#" + image.attr("position");
                if (this.notifyPlaceholdersPositions.hasOwnProperty(key)) {
                    placeholderRect = this.notifyPlaceholdersPositions[key];
                    notifyBoxRect = this.notifyBoxPositions[key];
                }
                else {
                    placeholderRect = image[0].getBoundingClientRect();
                    notifyBoxRect = notifyBox[0].getClientRects()[0];
                    this.notifyPlaceholdersPositions[key] = placeholderRect;
                    this.notifyBoxPositions[key] = notifyBoxRect;
                }
                notifyBox.css("left", (placeholderRect.left - notifyBoxRect.width / 2) + "px");
                notifyBox.css("top", (placeholderRect.top - notifyBox.height() * 3) + "px");
            }
            else {
                placeholderRect = placeholder[0].getBoundingClientRect();
                notifyBox.css("left", placeholderRect.left - 10 + "px");
                notifyBox.css("top", placeholderRect.top - 10 + "px");
            }
        };
        SxaMover.prototype.shouldCreatePlaceholder = function (rendering, $openCode) {
            var key = $openCode.attr("key"), chromeKey, chrome, i;
            if ($openCode.siblings(".scEmptyPlaceholder[sc-placeholder-id=\"" + $openCode.attr("id") + "\"]").length !== 0) {
                return;
            }
            if (this.$.inArray(rendering.data("id"), this.placeholders[key]) === -1) {
                return;
            }
            for (i = 0; i < this.chromes.length; i++) {
                chrome = this.chromes[i];
                if (chrome._originalDOMElement.length > 0) {
                    chromeKey = chrome._originalDOMElement[0].attributes["key"];
                    if (chromeKey !== undefined && chromeKey !== null && chromeKey.value === key && chrome.data !== undefined && chrome.data.custom !== undefined && chrome.data.custom.editable === "false") {
                        return;
                    }
                }
            }
            return true;
        };
        SxaMover.prototype.getPlaceholdersRenderings = function () {
            var _this = this;
            return Sitecore.PageModes.DesignManager.placeholders().map(function (ph) {
                var renderings = [], i;
                for (i = 0; i < ph.element.length; i++) {
                    if (_this.$(ph.element[i]).is(".component,.json-component-wrapper")) {
                        renderings.push(ph.element[i]);
                    }
                }
                return {
                    name: ph.type.placeholderKey(),
                    renderings: renderings
                };
            });
        };
        SxaMover.prototype.postMoveActions = function (component) {
            try {
                var componentID = component.openingMarker().attr("id");
                Sitecore.PageModes.PageEditor.layoutDefinitionControl().value = Sitecore.PageModes.PageEditor.layout().val();
                Sitecore.PageModes.ChromeManager.handleMessage("chrome:rendering:propertiescompleted", { controlId: componentID });
            }
            catch (e) {
            }
        };
        SxaMover.prototype.getPlaceholderFullPath = function (component) {
            var ph = Sitecore.LayoutDefinition.getRendering(component.type.uniqueId())["@ph"];
            if (ph.indexOf("/") === 0) {
                return ph;
            }
            else {
                return "/" + ph;
            }
        };
        SxaMover.prototype.getPlaceholderFromId = function (phId) {
            return Sitecore.PageModes.DesignManager.placeholders().filter(function (p) { return (p.openingMarker()[0].id === phId.replace(/\//g, "_").replace(/-/g, "_")); });
        };
        return SxaMover;
    }());
    SXA.SxaMover = SxaMover;
    var MouseManager = (function () {
        function MouseManager() {
            this.dropPlaces = [];
            this.dropPlacesPositions = {};
            this.tolleranceX = 10;
            this.tolleranceY = 50;
            this.refreshTime = 5;
            this.initialized = false;
            this.processedPlaceholderIcons = [];
            this.useLineProximity = true;
            this.$ = jQuery;
            this.init();
        }
        MouseManager.prototype.trackDropPlace = function (dropPlace) {
            var key = dropPlace.attr("key") + "#" + dropPlace.attr("position"), scrollTop = document.body.scrollTop || document.documentElement.scrollTop, rect;
            if (this.useLineProximity) {
                dropPlace = dropPlace.next();
            }
            else {
                this.tolleranceX = 100;
                this.tolleranceY = 100;
            }
            if (this.dropPlacesPositions.hasOwnProperty(key)) {
                rect = this.dropPlacesPositions[key];
            }
            else {
                rect = dropPlace[0].getBoundingClientRect();
                this.dropPlacesPositions[key] = rect;
            }
            this.init();
            this.dropPlaces.push({
                "dropPlace": dropPlace,
                "top": rect.top + scrollTop - this.tolleranceY,
                "bottom": rect.bottom + scrollTop + this.tolleranceY,
                "left": rect.left - this.tolleranceX,
                "right": rect.right + this.tolleranceX
            });
        };
        MouseManager.prototype.stopTracking = function () {
            this.dropPlaces = [];
            this.$(document).unbind("mousemove");
            this.initialized = false;
            this.processedPlaceholderIcons = [];
            this.dropPlacesPositions = {};
        };
        MouseManager.prototype.init = function () {
            var _this = this;
            if (!this.initialized) {
                this.$(document).mousemove(function (event) {
                    if (_this.timer) {
                        clearTimeout(_this.timer);
                    }
                    _this.timer = setTimeout(function () {
                        _this.trackMousePosition(event);
                    }, _this.refreshTime);
                    _this.initialized = true;
                });
                this.$(window).resize(function () {
                    _this.dropPlacesPositions = {};
                });
            }
        };
        MouseManager.prototype.trackMousePosition = function (event) {
            var dropPlaceData, showElements = [], nextToDropPlace, length = this.dropPlaces.length, i;
            for (i = 0; i < length; i++) {
                dropPlaceData = this.dropPlaces[i];
                nextToDropPlace = this.useLineProximity ? dropPlaceData.dropPlace.prev() : dropPlaceData.dropPlace.next();
                if (event.pageY < dropPlaceData.bottom && event.pageY > dropPlaceData.top && event.pageX > dropPlaceData.left && event.pageX < dropPlaceData.right) {
                    dropPlaceData.dropPlace.css("visibility", "visible");
                    nextToDropPlace.css("visibility", "visible");
                    if (this.useLineProximity && nextToDropPlace.length > 0) {
                        showElements.push(nextToDropPlace);
                    }
                    else {
                        showElements.push(dropPlaceData.dropPlace);
                    }
                }
                else if (dropPlaceData.dropPlace.css("visibility") === "visible") {
                    dropPlaceData.dropPlace.css("visibility", "hidden");
                    nextToDropPlace.css("visibility", "hidden");
                    showElements = showElements.filter(function (dropPlace) {
                        return dropPlace.attr("key") === (this.useLineProximity ? dropPlaceData.dropPlace.prev().attr("key") : dropPlaceData.dropPlace.attr("key"));
                    });
                }
            }
            this.moveDropPlaces(showElements);
        };
        MouseManager.prototype.collide = function (groupElements, element) {
            var i, elementToCheck;
            for (i = 0; i < groupElements.length; i++) {
                elementToCheck = groupElements[i];
                if (elementToCheck.hasClass("position-updated") || (elementToCheck.attr("key") === element.attr("key") && elementToCheck.attr("position") === element.attr("position"))) {
                    continue;
                }
                if (this.yInstersection(elementToCheck, element) && this.xInstersection(elementToCheck, element)) {
                    return true;
                }
            }
            return false;
        };
        MouseManager.prototype.findSmallestY = function (div0, div1) {
            return (div0.offset().top < div1.offset().top) ? div0 : div1;
        };
        MouseManager.prototype.yInstersection = function (div0, div1) {
            var divY0 = this.findSmallestY(div0, div1), divY1 = (div0 !== divY0) ? div0 : div1;
            return (divY0.offset().top + divY0.height()) - divY1.offset().top > 0;
        };
        MouseManager.prototype.findSmallestX = function (div0, div1) {
            return (div0.offset().left < div1.offset().left) ? div0 : div1;
        };
        MouseManager.prototype.xInstersection = function (div0, div1) {
            var divX0 = this.findSmallestX(div0, div1), divX1 = (div0 !== divX0) ? div0 : div1;
            return (divX0.offset().left + divX0.width()) - divX1.offset().left > 0;
        };
        MouseManager.prototype.moveDropPlaces = function (showElements) {
            var i, key, placeholderKey, groups = {}, groupElements, groupElement, position, positions, showElement;
            for (i = 0; i < showElements.length; i++) {
                showElement = showElements[i];
                key = this.normalizeKey(showElement.attr("key"));
                if (groups.hasOwnProperty(key)) {
                    groups[key].push(showElement);
                }
                else {
                    groups[key] = [showElement];
                }
            }
            if (showElements.length > 1) {
                for (placeholderKey in groups) {
                    if (groups.hasOwnProperty(placeholderKey)) {
                        groupElements = groups[placeholderKey];
                        this.positions = [];
                        for (i = 1; i < groupElements.length; i++) {
                            groupElement = groupElements[i];
                            if (!groupElement.hasClass("position-updated") && this.collide(groupElements, groupElement)) {
                                this.position = parseInt(groupElements[0].css("left")) - 35;
                                if (this.positions.indexOf(this.position) !== -1) {
                                    this.position = this.positions[this.positions.length - 1] - 35;
                                }
                                groupElement.css("left", this.position);
                                groupElement.addClass("position-updated");
                                this.positions.push(this.position);
                            }
                        }
                    }
                }
            }
        };
        MouseManager.prototype.normalizeKey = function (key) {
            if (key.indexOf("/") === 0) {
                key = key.substr(1, key.length);
            }
            if (key.indexOf("/") !== -1) {
                key = key.substr(0, key.indexOf("/"));
            }
            return key;
        };
        return MouseManager;
    }());
})(SXA || (SXA = {}));
(function (SXA) {
    var Feature;
    (function (Feature) {
        var Composites;
        (function (Composites) {
            var CompositePlaceholderValidator = (function () {
                function CompositePlaceholderValidator() {
                }
                CompositePlaceholderValidator.prototype.GetCompositeId = function (placeholder) {
                    var section = new Placeholder(placeholder).GetCompositeSectionPlaceholder();
                    if (section != null) {
                        var temp = section.match(/(section-[\w]+-)\d-\d/g);
                        var identifiers = temp[0].replace(/section-[\w]+-/g, "").split('-');
                        var dsItemIndex = identifiers[0];
                        var dynamicPhID = identifiers[1];
                        var compositePlaceholderName = new Placeholder(placeholder).GetCompositePlaceholderName();
                        return compositePlaceholderName + "-" + dsItemIndex + dynamicPhID;
                    }
                    return "";
                };
                CompositePlaceholderValidator.prototype.validate = function (phX, phY) {
                    var pageEditor = Sitecore.PageModes.PageEditor;
                    if (pageEditor == null || pageEditor.onPageEditingOfComposites == null) {
                        return true;
                    }
                    return (this.GetCompositeId(phX) == this.GetCompositeId(phY));
                };
                return CompositePlaceholderValidator;
            }());
            Composites.CompositePlaceholderValidator = CompositePlaceholderValidator;
            var Placeholder = (function () {
                function Placeholder(placeholder) {
                    this.Parts = placeholder.split('/');
                    this.Parts = this.Parts.filter(function (v) { return v !== ''; });
                }
                Placeholder.prototype.GetLastPlaceholderName = function () {
                    return this.Parts.slice(-1)[0];
                };
                Placeholder.prototype.GetParentPlaceholderName = function () {
                    if ((this.Parts.length > 1)) {
                        return this.Parts[(this.Parts.length - 2)];
                    }
                    return this.Parts[0];
                };
                Placeholder.prototype.GetParentPlaceholderPath = function () {
                    if ((this.Parts.length > 1)) {
                        var parts = this.Parts.slice(0, (this.Parts.length - 1));
                        if ((parts.length == 1)) {
                            return parts.join("/");
                        }
                        return "/" + parts.join("/");
                    }
                    return this.Parts[0];
                };
                Placeholder.prototype.GetPlaceholderPath = function () {
                    if ((this.Parts != null)) {
                        if ((this.Parts.length == 1)) {
                            return this.Parts[0];
                        }
                        return "/" + this.Parts.join("/");
                    }
                    return "";
                };
                Placeholder.prototype.GetCompositeSectionPlaceholderName = function () {
                    var previousInShapeType;
                    var index = this.Parts.length - 1;
                    for (; index >= 0; index--) {
                        if (this.Parts[index].match(/section-[title|content]+-\d-\d/g)) {
                            previousInShapeType = this.Parts[index];
                            break;
                        }
                    }
                    return previousInShapeType;
                };
                Placeholder.prototype.GetCompositeSectionPlaceholder = function () {
                    var section = this.GetCompositeSectionPlaceholderName();
                    if ((section != null)) {
                        var index = this.Parts.lastIndexOf(section);
                        for (var i = 0; (i < index); i++) {
                            this.Parts.shift();
                        }
                        return this.GetPlaceholderPath();
                    }
                    return null;
                };
                Placeholder.prototype.GetCompositePlaceholderName = function () {
                    var nearestCompositeSectionPlaceholder = this.GetCompositeSectionPlaceholderName();
                    var sectionIndex = this.Parts.lastIndexOf(nearestCompositeSectionPlaceholder);
                    if ((sectionIndex >= 1)) {
                        return this.Parts[(sectionIndex - 1)];
                    }
                    return null;
                };
                return Placeholder;
            }());
            Composites.Placeholder = Placeholder;
        })(Composites = Feature.Composites || (Feature.Composites = {}));
    })(Feature = SXA.Feature || (SXA.Feature = {}));
})(SXA || (SXA = {}));
