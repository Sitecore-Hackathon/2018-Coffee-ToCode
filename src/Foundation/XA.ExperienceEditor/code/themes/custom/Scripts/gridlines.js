if (typeof ($xa) !== "undefined") {
    $xa.gridlines = (function ($, document, Sitecore) {
        var api = {},
            columnclass = "",
            gridlines = new Gridlines(),
            columnNumber = 12,
            gridlineselement,
            gridname;

        function findParentPlaceholder(chrome) {
            var parent = chrome.parent(true);
            if (parent != null && parent.type.constructor !== Sitecore.PageModes.ChromeTypes.Placeholder) {
                parent = findParentPlaceholder(parent);
            }
            return parent;
        }

        function getColumnNumber(placeholserwrapper) {
            if (gridname == "Grid 960") {
                var classes = placeholserwrapper.attr("class").split(' ');
                for (var i = 0; i < classes.length; i++) {
                    var cls = classes[i];
                    if (cls.indexOf("grid-") >= 0) {
                        return parseInt(cls.substr(5));
                    }
                }
            } else {
                return columnNumber;
            }
        }

        function drawColumn(height) {
            var col = $sc('<div />');
            col.addClass('grid-1 grid-column ' + columnclass);
            col.css({
                'min-width': col.width(),
                'height': height
            });

            return col;
        }

        function Gridlines() {
        }

        Gridlines.prototype.drawGridlines = function (chrome) {
            if (chrome == null) {
                return;
            }

            if (gridlineselement != undefined) {
                gridlineselement.remove();
            }

            var placeholder = chrome;

            if (placeholder.type.constructor !== Sitecore.PageModes.ChromeTypes.Placeholder) {
                placeholder = findParentPlaceholder(placeholder);
            }
            var originalElement;
            var plwrapper;
            if (placeholder == null) {
                originalElement = $sc(chrome._originalDOMElement).closest('div[sc-part-of="placeholder rendering"]');
                plwrapper = $sc(originalElement);

            } else {
                originalElement = placeholder._originalDOMElement;
                plwrapper = $sc(originalElement).parent();
            }

            var $gridlines = $("<div class='canvas-lines visible'></div>"),
                height = plwrapper.height();

            $gridlines.css({
                "width": plwrapper.width(),
                "top": 0//top
            });

            $gridlines.append(drawColumn(height));

            var columns = getColumnNumber(plwrapper);

            for (j = 1, l = columns; j < l; j++) {
                $gridlines.append(drawColumn(height));
            }

            gridlineselement = $gridlines;
            plwrapper.append($gridlines);
        };

        Gridlines.prototype.bindEvents = function () {
            Sitecore.PageModes.ChromeManager.selectionChanged.observe(this.drawGridlines);
        };

        Gridlines.prototype.unbindEvents = function () {
            Sitecore.PageModes.ChromeManager.selectionChanged.stopObserving(this.drawGridlines);
        };

        api.remove = function () {
            var $gridlines = $('.canvas-lines');
            $gridlines.remove();
            gridlines.unbindEvents();
        };

        api.init = function (cl, gn) {
            gridname = gn;
            columnclass = cl;
            gridlines.drawGridlines();
            gridlines.bindEvents();
        };

        return api;
    }($xa, document, Sitecore));
}