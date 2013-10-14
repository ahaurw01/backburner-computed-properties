$(function () {
  var model = new ComputeModel({
    fullName: function (firstName, lastName) {
      return firstName + ' ' + lastName;
    }.computed('firstName', 'lastName'),

    fullerName: function (fullName) {
      return 'The Honorable ' + fullName;
    }.computed('fullName'),
    firstName: 'Aaron',

    lastName: 'Haurwitz'
  });

  var template = Handlebars.compile($('#my-template').html());
  function render() {
    $('#content').html(template({
      fullName: model.get('fullName'),
      fullerName: model.get('fullerName')
    }));
  }
  model.registerChangeHandler(render);
  render();

  window.firstNameHandler = function (event) {
    model.set('firstName', $('#firstName').val());
  };

  window.lastNameHandler = function (event) {
    model.set('lastName', $('#lastName').val());
  };
});