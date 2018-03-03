if (typeof ($xa) !== "undefined") {
	$xa.dragndrop = (function ($) {
	    var pub = {},
            dragClass = "xa-rendering-dragger",
			isEnabled = false;

		var dragComponentPlugIn = function () {
			var dragBox = $('<div />').addClass(dragClass),
				onSelectionUpdate,
				expand,
				selected,
				frame,
				controlsDiv,
				getDragOptions,
				dragDiv,
				toolbar,
				getPlaceholderPositionChange,
				isPositionChanged,
				isPlaceholderNestedInsideComponent;

				getPlaceholderPositionChange = function (rendering, idx, allElements) {
					var component = rendering.data("component"),
						element = $(allElements[idx])[0];
					if (element.id == component._openingMarker[0].id) {
						return 0;//when element(placeholder) is the same as component
					}

					if ($.inArray(element, rendering.data("frame").chrome.element) >= 0) {
						return 1;//when placeholder contains your component wraper (so it's the same place on the page)
					}

					if (element == component._closingMarker[0]) {
						return 0;//when element is closing wrapper
					}

					return -1;
				};

				isPositionChanged = function (component, position, placeholder) {
					var componentPlaceholder = component.type.getPlaceholder(), componentPosition;

					if ($(componentPlaceholder.openingMarker()).attr("key") != placeholder) {
						return true;
					}

					componentPosition = Sitecore.LayoutDefinition.getRenderingPositionInPlaceholder(placeholder, component.type.uniqueId());
					return position != componentPosition && position != componentPosition + 1;
				};

				isPlaceholderNestedInsideComponent = function (componentPlaceholder, placeholder, rendering) {
					var p, ph, tree = rendering.data("tree");

					if (componentPlaceholder == placeholder) {
						return false;
					}

					for (p = 0; p < tree.descendantPlaceholders.length; p++) {
						if (placeholder.indexOf(tree.descendantPlaceholders[p]) >= 0) {
							return true;
						}
					}

					return false;
				};

				getDragOptions = function (component, selectionFrame) {
					return {
						opacity: 0.7,
						cursor: "move",
						scroll: true,
						appendTo: '#wrapper',
						handle: "." + dragClass,						
						refreshPositions: true,
						start: function () {
						    var renderingID;
						    $('.ui-draggable-dragging').addClass('no-pointer-events');
							$.xaMover.refreshConfiguration();
							renderingID = selectionFrame.chrome.data.custom.renderingID;
							$(this).data("id", renderingID);
							$(this).data("component", component);
							$(this).data("frame", selectionFrame);
							$(this).data("moving", true);
							$(this).data("getPlaceholderPositionChange", getPlaceholderPositionChange);
							$(this).data("isPositionChanged", isPositionChanged);
							$(this).data("isPlaceholderNestedInsideComponent", isPlaceholderNestedInsideComponent);
							$(this).data("tree", $.xaMover.getComponentTree(component));
							$.xaMover.prepareDroppablePlaceholders($(this));
						},
						stop: function () {
							delete $(this).data("moving");
							$('.ui-draggable-dragging').removeClass('no-pointer-events');
							selectionFrame.hide();
							setTimeout(function () {
								$.xaMover.clearDroppablePlaceholders();
							}, 50);
						}
					};
				};

				onSelectionUpdate = function () {
					selected = Sitecore.PageModes.ChromeManager.selectedChrome();
					if (selected == null) {
						return;
					}

					frame = Sitecore.PageModes.ChromeManager.selectionFrame();
					controlsDiv = $(frame.controls.commands[0]);
					toolbar = controlsDiv.parent();
					dragDiv = controlsDiv.find(".scChromeName");
					if (selected.key() != "rendering") {
						try {
							toolbar.draggable("disable");	//turns of dragging the main placeholder
							toolbar.removeClass("ui-state-disabled");
						}
						catch (error) {
						}
					} else if (controlsDiv.find("." + dragClass).length == 0) {	//turns on any toolbar which is not placeholder
						dragDiv.append(dragBox);
						toolbar.draggable(getDragOptions(selected, frame));
						toolbar.draggable("enable");
					}
				};

				//binds to selection change event, but it's not fired when you click "expand selection"
				onSelectionUpdate.dragndrop = true;
				Sitecore.PageModes.ChromeManager.selectionChanged._callbacks.push(onSelectionUpdate);
				//and so here's the fix:
				var _oldExpand = Sitecore.PageModes.ChromeControls.prototype.renderExpandCommand;
				expand = function () {	//it wraps Sitecore's method
					var context = this;
					if(isEnabled){
						onSelectionUpdate();
					}
					return _oldExpand.call(context); // am I evil ?
				};
				Sitecore.PageModes.ChromeControls.prototype.renderExpandCommand = expand;

		};

		pub.init = function () {
			dragComponentPlugIn();
			isEnabled = true;
		};

		pub.remove = function () {		    
		    var dragger = $('body').find("." + dragClass),
				callbacks = Sitecore.PageModes.ChromeManager.selectionChanged._callbacks;
			dragger.unbind().remove();

			for(var i=0; i<callbacks.length;i++){
				if(callbacks[i].hasOwnProperty("dragndrop")){
					Sitecore.PageModes.ChromeManager.selectionChanged._callbacks.splice(i,1);
					break;
				}
			}
			isEnabled = false;
		};

		return pub;
	}($xa));
}
