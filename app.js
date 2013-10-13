var Backburner = window.backburner.Backburner;

var ComputeModel = function (hash) {
  this.backburner = new Backburner(['sync', 'recompute']);
  this.backburner.run(function () {
    // Do this all inside of run() so we know baseline values are set before computation
    var key, value;
    for (key in hash) {
      if (hash.hasOwnProperty(key)) {
        value = hash[key];
        if (value instanceof ComputeModel.ComputedProperty) {
          // Create this computed property
          this.createComputedProperty(key, value.compute, value.dependentProperties);
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
  backburner: null,

  _values: {},

  computedProperties: [],

  get: function (key) {
    return this._values[key];
  },

  set: function (key, value) {
    // Set the value immediately, defer the computation of related computed properties
    this._values[key] = value;
    this.scheduleSync(key);
  },

  createComputedProperty: function (key, fn, dependentProperties) {
    this.computedProperties.push({
      key: key,
      compute: fn,
      dependentProperties: dependentProperties
    });
    // Kick off eventual computation
    var backburner = this.backburner,
        self = this;
    backburner.run(function () {
      dependentProperties.forEach(function (dp) {
        self.scheduleSync(dp);
      });
    });
  },

  scheduleSync: function (key) {
    log('Scheduling sync: ' + key);
    this.backburner.deferOnce('sync', this, 'scheduleRecompute', key); // Don't need to be notified multiple times for this one key
  },

  scheduleRecompute: function (changedKey) {
    this.computedProperties.forEach(function (cp) {
      // Does this guy depend on `changedKey`? If so, recompute him.
      if (cp.dependentProperties.indexOf(changedKey) >= 0) {
        log('Scheduling recompute: ' + cp.key);
        this.backburner.deferOnce('recompute', this, 'recompute', cp);
      }
    }.bind(this));
  },

  recompute: function (computedProperty) {
    // Retrieve the current values for the dependent keys
    var injectedArgs = computedProperty.dependentProperties.map(function (dp) {
      return this._values[dp];
    }.bind(this));
    log('Recomputing: ' + computedProperty.key);
    this._values[computedProperty.key] = computedProperty.compute.apply(this, injectedArgs);
    // Maybe somebody else depends on this computed property!
    this.backburner.setTimeout(this, 'scheduleSync', computedProperty.key, 1);
  }
};

ComputeModel.ComputedProperty = function (compute, dependentProperties) {
  this.compute = compute;
  this.dependentProperties = dependentProperties;
};
Function.prototype.computed = function () {
  var dependentProperties = Array.prototype.slice.call(arguments);
  return new ComputeModel.ComputedProperty(this, dependentProperties);      
};

ComputeModel.LOGGING = true;

var cm = new ComputeModel({
  firstName: 'Aaron',

  lastName: 'Haurwitz',

  fullName: function (firstName, lastName) {
    return firstName + ' ' + lastName;
  }.computed('firstName', 'lastName'),

  fullerName: function (fullName) {
    return 'The honorable ' + fullName;
  }.computed('fullName')
});