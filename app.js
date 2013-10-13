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