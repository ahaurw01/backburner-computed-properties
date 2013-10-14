# Backburner Computed Properties

An exercise using @ebryn's backburner.js. 

```
var person = new ComputeModel({
  firstName: 'Aaron',

  middleName: 'Hans Raymond',

  lastName: 'Haurwitz',

  fullName: function (firstName, middleName, lastName) {
    return [firstName, middleName, lastName].join(' ');
  }.computed('firstName', 'middleName', 'lastName'),

  isNameTooLong: function (fullName) {
    return fullName.length > 20;
  }.computed('fullName')
});
```

```
person.set('middleName', 'Danger Zone');
person.get('fullName'); // Aaron Danger Zone Haurwitz
```

```
person.set('middleName', 'H. R.');
person.get('isNameTooLong'); // false
```