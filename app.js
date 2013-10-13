var Backburner = window.backburner.Backburner;

var ComputeModel = function (hash) {
  this.backburner = new Backburner(['beforeRecompute', 'recompute', 'afterRecompute']);
  this._values = {}; // Hash of stored property values
  this.computedProperties = []; // List of computed properties to track
  this.backburner.run(function () {
    // Do this all inside of run() so we know baseline values are set before computation
    var key, value;
    for (key in hash) {
      if (hash.hasOwnProperty(key)) {
        value = hash[key];
        if (value instanceof ComputeModel.ComputedProperty) {
          // Create this computed property
          this.createComputedProperty(key, value);
        } else {
          // Plain old-fashioned key/value pair
          this._values[key] = hash[key];
        }
      }
    }
  }.bind(this));
};
function log(msg) {
  if (ComputeModel.LOGGING) {
    console.info(msg);
  }
}
ComputeModel.prototype = {
  /**
   * Retrieve the stored value of the given property
   * @param {string} key - name of the property
   */
  get: function (key) {
    return this._values[key];
  },

  /**
   * Set the value of a property and defer computation of related computed properties
   * @param {string} key - name of the property
   * @param {string} value - new value
   */
  set: function (key, value) {
    // Set the value immediately, defer the computation of related computed properties
    this._values[key] = value;
    this.scheduleSync(key);
    this.scheduleNotify(key);
  },

  registerChangeHandler: function (handler) {
    this.changeHandlers = this.changeHandlers || [];
    this.changeHandlers.push(handler);
  },

  unregisterChangeHandler: function (handler) {
    this.changeHandlers = this.changeHandlers || [];
    var index = this.changeHandlers.indexOf(handler);
    if (index >= 0) {
      this.changeHandlers.splice(index, 1);
    }
  },

  /**
   * Initialize a computed property. Meant to be called from the constructor.
   * @private
   * @param {string} key - name of the property to create
   * @param {ComputeModel.ComputedProperty} - computed property instance
   */
  createComputedProperty: function (key, computedProperty) {
    computedProperty.key = key;
    this.computedProperties.push(computedProperty);
    // Kick off eventual computation
    var backburner = this.backburner,
        self = this;
    backburner.run(function () {
      computedProperty.dependentProperties.forEach(function (dp) {
        self.scheduleSync(dp);
      });
    });
  },

  /**
   * Schedule the eventual change notification of this property
   * @private
   * @param {string} key - name of the property that is changing
   */
  scheduleSync: function (key) {
    log('Scheduling beforeRecompute: ' + key);
    this.backburner.deferOnce('beforeRecompute', this, 'scheduleRecompute', key); // Don't need to be notified multiple times for this one key
  },

  /**
   * Schedule the eventual computation of a property
   * @private
   * @param {string} key - name of the property that will be recomputed
   */
  scheduleRecompute: function (key) {
    this.computedProperties.forEach(function (cp) {
      // Does this guy depend on `key`? If so, recompute him.
      if (cp.dependentProperties.indexOf(key) >= 0) {
        log('Scheduling recompute: ' + cp.key);
        this.backburner.deferOnce('recompute', this, 'recompute', cp);
      }
    }.bind(this));
  },

  /**
   * Schedule the eventual notification of value changes
   * @private
   * @param {string} key - name of the property that has changed
   */
  scheduleNotify: function (key) {
    log('Scheduling notify: ' + key);
    this._changedProperties = this._changedProperties || [];
    if (this._changedProperties.indexOf(key) === -1) {
      this._changedProperties.push(key);
    }
    this.backburner.deferOnce('afterRecompute', this, 'notify');
  },

  /**
   * Recompute the value for the given property
   * @private
   * @param {ComputeModel.ComputedProperty} computedProperty
   */
  recompute: function (computedProperty) {
    // Retrieve the current values for the dependent keys
    var injectedArgs = computedProperty.dependentProperties.map(function (dp) {
      return this._values[dp];
    }.bind(this));
    log('Recomputing: ' + computedProperty.key);
    this._values[computedProperty.key] = computedProperty.compute.apply(this, injectedArgs);
    this.scheduleNotify(computedProperty.key);
    // Maybe somebody else depends on this computed property!
    this.scheduleSync(computedProperty.key);
  },

  /**
   * Notify external parties of value changes.
   * Reads the values in the _changedProperties array set by `scheduleNotify`
   * @private
   */
  notify: function () {
    if (!this.changeHandlers) {
      return;
    }
    var changedProperties = this._changedProperties;
    this.changeHandlers.forEach(function (handler) {
      handler(changedProperties.slice());
    });
    this._changedProperties = [];
  }
};

/**
 * Computed property constructor
 * @constructor
 */
ComputeModel.ComputedProperty = function (compute, dependentProperties) {
  this.compute = compute;
  this.dependentProperties = dependentProperties;
};

/**
 * Create a ComputedProperty instance based off of the function
 */
Function.prototype.computed = function () {
  var dependentProperties = Array.prototype.slice.call(arguments);
  return new ComputeModel.ComputedProperty(this, dependentProperties);      
};

ComputeModel.LOGGING = false;

$(function () {
  var model = new ComputeModel({
    firstName: 'Aaron',

    lastName: 'Haurwitz',

    fullName: function (firstName, lastName) {
      return firstName + ' ' + lastName;
    }.computed('firstName', 'lastName'),

    fullerName: function (fullName) {
      return 'The Honorable ' + fullName;
    }.computed('fullName')
  });

  var template = Handlebars.compile($('#my-template').html());
  function render() {
    console.log('rendering!');
    $('body').html(template({
      fullName: model.get('fullName'),
      fullerName: model.get('fullerName')
    }));
  }
  model.registerChangeHandler(render);
  render();

  window.model = model;
});