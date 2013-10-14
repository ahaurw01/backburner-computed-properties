$(function () {
  var kitty = new ComputeModel({
    name: 'ToobSox',
    weight: 12,
    sassLevel: 'notSassy',

    isFatAndSassy: function (weight, sassLevel) {
      return weight > 14 && ['quiteSassy', 'ludicrouslySassy'].indexOf(sassLevel) >= 0;
    }.computed('weight', 'sassLevel'),

    description: function (name, isFatAndSassy) {
      return name + (isFatAndSassy ? ', Jedi Cat' : ', Padawan Learner Kitten');
    }.computed('name', 'isFatAndSassy')
  });

  var template = Handlebars.compile($('#my-template').html());

  function render() {
    $('#content').html(template({
      name: kitty.get('name'),
      description: kitty.get('description')
    }));
  }
  kitty.registerChangeHandler(render);
  render();

  // Set up input handlers
  $('#name').keyup(function (event) {
    kitty.set('name', $(event.target).val());
  });

  $('#weight').keyup(function (event) {
    kitty.set('weight', +$(event.target).val());
  });

  $('input[type="radio"]').click(function (event) {
    kitty.set('sassLevel', $(event.target).val());
  });
});