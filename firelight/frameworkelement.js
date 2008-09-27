function FrameworkElement ()
{
  UIElement.apply (this, arguments);

  this.renderPosition = new Point (0,0);
  this.renderSize = new Size (NaN,NaN);
}

FrameworkElement.prototype = $.extend(new UIElement(), {
  findName : function (name) {
    // look up the visual (XXX should be logical) tree for an element
    // with a namescope
    var ns_obj = this;
    var ns = null;
    while (ns_obj) {
      if ((ns = NameScope.getNameScope (ns_obj)))
	break;
      ns_obj = ns_obj.getVisualParent();
    }
    if (!ns)
      return null;
    return ns.findName (name);
  },



  onPropertyChanged: function (args) {
    Trace.debug ("in FrameworkElement.onPropertyChanged");
    if (args.property.affectsMeasure)
      this.invalidateMeasure ();
    if (args.property.affectsArrange)
      this.invalidateArrange ();
    if (args.property.affectsParentMeasure && this.getVisualParent())
      this.getVisualParent().invalidateMeasure ();

    UIElement.prototype.onPropertyChanged.call (this, args);
  },

  measureOverride: function (availableSize) {
    Trace.debug ("in FrameworkElement.measureOverride");

    if (!this.getVisualParent() || this.getVisualParent() instanceof Canvas)
      return new Size (NaN, NaN);

      return new Size (this.width, this.height);
  },

  arrangeOverride: function (finalSize) {
    Trace.debug ("in FrameworkElement.arrangeOverride (" + this.name + ")");
//    if (!this.getVisualParent () || this.getVisualParent () instanceof Canvas) {
//      Trace.debug ("ugly canvas hack");
//      return new Size (NaN,NaN);
//    }

    var size = finalSize;

    var specified = new Size (this.width, this.height);

    Trace.debug ("size = " + finalSize + ", specified = " + specified);

    // postcondition the results
    size = size.min (specified);
    size = size.max (specified);

    return size;
  },

  setRenderPosition: function (point) {
    this.renderPosition = point;
    if (this.renderPositionBinding)
      this.renderPositionBinding.update();
  },

  toString: function () {
    return "FrameworkElement";
  },

  measure: function (availableSize) {
    var specified = new Size (this.width, this.height);

    Trace.debug ("measure on " + this.name + ", specified size = " + specified);

    var size = availableSize.shrinkBy (this.margin);

    size = size.min (specified);
    size = size.max (specified);

    size = size.min (this.maxWidth, this.maxHeight);
    size = size.max (this.minWidth, this.minHeight);

    size = this.measureOverride (size);

    this.actualWidth = this.width;
    this.actualHeight = this.height;

    // XXX ugly hack to fake some sort of exception case
    if (isNaN (size.width) || isNaN (size.height)) {
      this.desiredSize = new Size (0, 0);
    }

    // postcondition the results
    size = size.min (specified);
    size = size.max (specified);

    size = size.min (this.maxWidth, this.maxHeight);
    size = size.max (this.minWidth, this.minHeight);

    size = size.growBy (this.margin);

    size = size.min (availableSize);

    this.desiredSize = size;
  },

  arrange: function (finalRect) {
    this.setValue (LayoutInformation.prototype.LayoutSlotProperty,
		   new Rect (finalRect.left, finalRect.top, finalRect.width, finalRect.height));

    var specified = new Size (this.width, this.height);
    Trace.debug ("measure on " + this.name + ", specified size = " + specified);

    finalRect.shrinkBy (this.margin);

    var size = new Size (finalRect.width, finalRect.height);

    size = this.arrangeOverride (size);

    // XXX ugly hack to fake some sort of exception case
    if (isNaN (size.width) || isNaN (size.height)) {
      this.renderSize = new Size (0,0);
      return;
    }

    this.renderSize = size;
    this.actualWidth = size.width;
    this.actualHeight = size.height;

    if (this.renderSizeBinding)
      this.renderSizeBinding.update ();

    // XXX what do we do with finalRect.x and y?
    // XXX do this for now
    this.renderPosition = new Point (finalRect.left, finalRect.top);
    if (this.renderPositionBinding)
      this.renderPositionBinding.update ();
    Trace.debug (this.name + " renderSize = " + this.renderSize);

    //Trace.debug ("more here in FrameworkElement::Arrange.  move the bounds or something?  set properties?  who knows!?");
  }
});

DependencyProperties.register (FrameworkElement, "Width",
			       { defaultValue: NaN,
				 affectsParentMeasure: true });

DependencyProperties.register (FrameworkElement, "Height",
			       { defaultValue: NaN,
				 affectsParentMeasure: true });

DependencyProperties.register (FrameworkElement, "MinWidth",
			       { defaultValue: 0.0,
				 affectsParentMeasure: true });
DependencyProperties.register (FrameworkElement, "MinHeight",
			       { defaultValue: 0.0,
				 affectsParentMeasure: true });

DependencyProperties.register (FrameworkElement, "MaxWidth",
			       { defaultValue: Infinity,
				 affectsParentMeasure: true });

DependencyProperties.register (FrameworkElement, "MaxHeight",
			       { defaultValue: Infinity,
				 affectsParentMeasure: true });

DependencyProperties.register (FrameworkElement, "Margin",
			       { defaultValue: function () {
				     return { left: 0.0, top: 0.0, right: 0.0, bottom: 0.0 };
				 },
				 affectsMeasure: true });

DependencyProperties.register (FrameworkElement, "Triggers",
			       { defaultValue: function () { return new TriggerCollection(); },
				 propertyType: TriggerCollection });

Types.registerType ("System.Windows", FrameworkElement);
