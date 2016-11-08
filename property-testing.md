Всем привет, меня зовут Мельников Андрей и сегодня я хотел бы обсудить тему оценки и доказательства свойств программных решений.
В чем состоит задача программиста? Один из самых популярных ответов - предоставлять некотрое решение существующей проблемы(иногда решение может и не содержать какого либо кода). Неотемлимой частью предоставления решения является стадия анализа разработанного решения - в котором мы пытаемся понять что за решение мы получили какие у него ограничения область применения, на какие компромисы оно идет - на сколько оно решает изначальную проблему и сколько других проблем добавляет. На сегодняшний день большая часть анализа протекает в нефрмальных терминах - "Это ненадежное решение", "Это плохо читаемый код", "Плохо тестируется" и так далее. Для формального анализа мы в большинстве случаев используем различные виды тестов основанных на тест-кейсах.
Неформальный анализ нас сейчас не интересует так как он имеет больше отношение к философии и софистике нежели к точным наукам. Поэтому давайте сконцентрируемся на тестировании, взглянув на него с точки зрения точной науки то есть математики. Математики так же как и программисты создают решения и анализируют их - возьмем для примера анализ функций(они ближе всего к програмам). Что по сути такое тест-кейс с точки зрения анализа функции? Это некотрая точка(координата) функции, а сам тест соотвественно анализ поведения функции в этой точке(причем точки обычно выбираются не случайно а на разных участках с разным поведением функции - для этого обычно используется информация по покрытию кода). Исследования поведения функции в некотрых важных точках неотъемлимая часть математического анализа. Однако также математики уделяют много времени анализу свойств справедливых для любых точек(значений) - например функция сложения аддитивна и коммутативна итд. Программы как и математические функции в большинстве случаев определены на очень большом числе значений(близком к бесконечному), однако по какой то причине мы редко интересуемся свойствами за пределами конкретных точек(тест-кейсов) - получается что мы можем быть в определенном поведении наших программ только в некотром ограниченном наборе точек - что конечно никуда не годится. Так что же мы можем сделать?

Давайте посмотрим сначала на простой пример(взятый из математики) а потом перейдем к более жизненному примеру. Рассмотрим обыкновенное сложение(далее для описания тестов я буду использовать jasmine-образный синтаксис):

```javascript
it('2 + 2 = 4', () => {
  expect(2 + 2).toBe(4);
})
```
Как я уже упоминал сложение обладает многими свойствами, но давайте выберем чтонибудь интересное с точки зрения программирования. К примеру - сумма двух положительных чисел всегда больше каждого из слагаемых то есть для любых `a` и `b` справедливо `a + b >= a && a + b >= b`. На javascript данное свойство можно записать в качестве функции:

```javascript
function(a, b) {
  return a + b >= a && a + b >= b;
}
```
Окей осталось немного - доказать это свойство :) Какие у нас есть варианты:
 - Обложится Coq/Agda/TLA+/Lean Prover и другими штуками для доказательства теорем и через пару лет мы возможно сможем проверить это свойство
 - Как и всегда в программировании мы можем в отличии от математиков чуть чуть срезать углы и просто проверить это свойство очень много раз на разных значениях

Сделать это довольно просто. Для начала напишем генератор необходимых значений:

```javascript
function genPosNumber() {
  return Math.random() * 10000000000;
}
```
Затем функцию которая принимает генератор и свойство и конструирует проверку свойства:

```javascript
function property(argGenerators, propertyFn) {
    return function() {
        var generatedArgs = argGenerators.map(gen => gen());

        return {
            success: propertyFn.apply(generatedArgs),
            args: generatedArgs
        };
    }
}
```

Ну и саму функцию которая будет проверять проперти заданое количество раз:

```javascript
function check(property, tries = 100) {
  for (var i = 0; i < tries; i++) {
    var res = property();
    if (!res.success) {
      throw new Error('Property hasnt held on arguments: ' + JSON.stringify(res.args, null, 2));
    }
  }
}
```
Теперь мы можем написать тест на наше свойство:

```javascript
it('forall a, b - a + b >= a && a + b >= b', () => {
  check(property(
    [genPosNumber, genPosNumber],
    function (a, b) {
      return a + b >= a && a + b >= b;
    }
  ))
})
```
Возникает вопрос а надо было чтото писать или все уже как всегда написано до нас? Ответ - да все уже написано. Данный подход называет property-based testing появился в [хаскеле-коммьюнити](http://www.eecs.northwestern.edu/~robby/courses/395-495-2009-fall/quick.pdf). На сегодняшний его имплементации есть практически для всех языков и конечно же для Javascript. В примерах я буду использовать встроенный в [Jest](https://facebook.github.io/jest/) [testcheck-js](https://github.com/leebyron/testcheck-js) который на самом деле является лишь биндингом к [test.check написанному на ClojureScript](https://github.com/clojure/test.check). Наш пример с его использованием запишется так:

```javascript
var testcheck = require('testcheck');
var gen = testcheck.gen;

it('forall a, b - a + b >= a && a + b >= b', () => {
  testcheck.check(testcheck.property(
    [gen.posInt, gen.posInt],
    function (a, b) {
      return a + b >= a && a + b >= b;
    }
  ))
})
```

В целом практически ничего не изменилось, кроме использования уже готовых функций и генераторов вместо самописных. Перейдем к примеру посложнее.

# Пример посложнее

Фронтенд почти всегда опрерирует сущностями которые были переданы нам с бекенда, и зачастую для более удобного их применения на фронтенде нам надо изменить их структуру. Тут все просто - у нас появляется некотрая функция `convertFrom` которая конвертирует структуру(допустим данные о семье) в удобную для отображения.

```javascript
function convertFrom(structFromBackend) {
  ...
  return structForFrontend;
}
```
Однако некотрые сущности не только отображаются но и редактируются - тогда нам надо добавить также функцию `convertTo` которая переведет структуру из представления фронтенда в исходную которую мы сможем сохранить на бекенде.

```javascript
function convertTo(structForFrontend) {
  ...
  return structFromBackend;
}
```

Наверно вы уже заметили одно свойство этих двух функций - `convertTo` обратная функция для `convertFrom`.
Давайте запишем это свойство на Javascript:

```javascript
function isRevertable(structFromBackend) {
  var structForFrontend = convertFrom(structFromBackend);
  var structForBackend = convertTo(structForFrontend)

  expect(structFromBackend).toEqual(structForBackend);
}
```

Теперь необходимо написать генератор для `structFromBackend`. Testcheck имеет большой набор встроенных генераторов комбинирую которые мы можем получать новые генераторы. Пример:

```javascript
gen.int // генератор целых чисел
gen.array // генератор массивов
gen.array(gen.int) // генератор массивов целых чисел
```
Из чего состоит наша структура - данные о семье:
 - `type` - может быть `espoused`, `single`, `common_law_marriage`, `null`, `undefined`
 - `members` - массив обьектов с такой структурой
   + `role` - может быть `sibling`, `child`, `parent`, `spouse`
   + `fio` - обьект с ключами `firstname`, `lastname`, `middlename`
   + `dependant` - `boolean` или `null` или `undefined`

Начнем с `type`, воспользуемся [документацией по генераторам](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L113):
Для перечислений используется генератор [returnOneOf](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L234):


```javascript
gen.returnOneOf(['espoused', 'single', 'common_law_marriage', null, undefined]),
```
Теперь самое сложное - генератор обьекта `member`. Генератор для `role` сконструируем с помощью уже использованного `returnOneOf`:

```javascript
gen.returnOneOf(['sibling', 'child', 'parent', 'spouse'])
```

Для `dependant` используем генераторы [gen.boolean](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L331), [gen.undefined](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L329), [gen.null](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L330), скомбинировав их при помощи [gen.oneOf](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L208):

```javascript
gen.oneOf([gen.boolean, gen.null, gen.undefined])
```

Для `fio` используем [gen.object](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L297) в комбинации с [gen.string](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L383), [gen.undefined](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L329), [gen.null](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L330):

```javascript
gen.object({
    firstname: gen.oneOf([gen.string, gen.null, gen.undefined]),
    lastname: gen.oneOf([gen.string, gen.null, gen.undefined]),
    middlename: gen.oneOf([gen.string, gen.null, gen.undefined])
})
```

Сведем все вместе:

```javascript
var familyInfoGen = gen.object({
  type: gen.returnOneOf(['espoused', 'single', 'common_law_marriage', null, undefined]),
  members: gen.array(
    gen.object({
      role: gen.returnOneOf(['sibling', 'child', 'parent', 'spouse']),
      fio: gen.object({
        firstname: gen.oneOf([gen.string, gen.null, gen.undefined]),
        lastname: gen.oneOf([gen.string, gen.null, gen.undefined]),
        middlename: gen.oneOf([gen.string, gen.null, gen.undefined])
      }),
      dependant: gen.oneOf([gen.boolean, gen.null, gen.undefined])
    })
  )
});
```

Проверяем:

```javascript
var sample = require('testcheck').sample;

console.log(JSON.stringify(sample(familyInfoGen, {times: 2}), null, 2))
/*
[
  {
    "type": "espoused",
    "members": []
  },
  {
    "type": null,
    "members": []
  }
]
*/
```
Хм, иногда у нас генерятся структуры без супруги, но при этом с `type=espoused`. Так быть не может - нам не могут прийти такие данные с бекенда. Как можно ограничить или преобразовать нашу генерируюмую последовательность по какому то правилу? Варианта два:
 - [suchThat](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L125) - фильтрует генерируюмую последовательность по предикату - не очень подходит так как увеличивает число попыток генерирации, что замедляет тесты
 - [map](https://github.com/leebyron/testcheck-js/blob/master/type-definitions/testcheck.d.ts#L146) - отображает элементы генерируемой последовательности согласно некотрой функции

Давайте посмотрим как мы можем применить `map` для наших целей. Для начала определимся с правилами:
 - Супруга может быть только одна
 - Если она есть то `type === espoused`
 - Если `type !== espoused` то ее быть не должно

Так и запишем:

```javascript
function mapFamily(familyObject) {
  var spouse = familyObject.members.filter(member => member.role === 'spouse'); // находим всех супруг
  if (familyObject.type === 'espoused' && spouse.length === 0) { // если женат а супруги нету
    return {
      type: familyObject.type,
      members: [
        { role: 'spouse', fio: {} },  // то добавляем ее
        ...familyObject.members
      ]
    }
  } else if (familyObject.type !== 'espoused' && spouse.length !== 0) { // если не женат а есть супруга
    return {
      type: familyObject.type,
      members: familyObject.members.filter(member => member.role !== 'spouse') // убираем ее
    }
  } else if (spouse.length > 1) {  // если супруг больше одной то оставляем только первую
    return {
      type: familyObject.type,
      members: familyObject.members.reduce((acc, member) => {
        if (member.role !== 'spouse' && acc.hasSpouse) {
          acc.members.push(member);
        } else if (member.role === 'spouse' && !acc.hasSpouse) {
          acc.members.push(member);
          acc.hasSpouse = true;
        }
        return acc;
      }, { members: [], hasSpouse: false }).members
    }
  }
  return familyObject;
}
```

Применим эту операцию к нашему генератору:

```javascript
var familyInfoGenFixed = gen.map(mapFamily, familyInfoGen);
```

Проверяем:

```javascript
console.log(JSON.stringify(sample(familyInfoGenFixed, {times: 2}), null, 2))
/*
[
  {
    "type": "espoused",
    "members": [
      {
        "role": "spouse",
        "fio": {}
      }
    ]
  },
  {
    "type": "common_law_marriage",
    "members": [
      {
        "role": "child",
        "fio": {
          "firstname": "&",
          "lastname": "",
          "middlename": null
        },
        "dependant": null
      }
    ]
  }
]
*/
```

Вот теперь генерируемые обьекты точно соотвествуют нашим требованиям - можно переходить непосредственно к проверке нашего свойства. Воспользуемся хелпером из пакета `jest-check` `check.it` - он принимает описания свойства, массив генераторов и свойство в виде функции.

```javascript
var { check } = require('jest-check');

check.it('convertTo is revert function for convertFrom', [familyInfoGenFixed], isRevertable);
```

Однако проверка нашего свойства заканчивается не успехом:

Все дело в том что функция `convertFrom` помимо преобразований из одной структуры в другую также еще проставляет некотрые дефолты(для `dependant` прописывается `false`) - то есть она не оставляет исходные значения. Что же делать?

# решение #1 - сложное

Первое что приходит в голову - да сами значения меняются, но структура то остается прежней!
Следовательно мы можем ослабить свойство и проверять не на точное равенство, а на что структура остается прежней:

```javascript
function isSameShape(structFromBackend) {
  var structForFrontend = convertFrom(structFromBackend);
  var structForBackend = convertTo(structForFrontend)

  expect(checkFamilyStruct(structForBackend)).toBe(true);
}
```

Осталось только написать функцию `checkFamilyStruct` :) Хм а если подумать? Вспомните ведь мы уже описывали структуру наших данных - в генераторе - мы описали и типы и различные ограничения для нашей структуры(в `mapFamily`). Можем ли мы как то переиспользовать создание нашего генератора для проверки структуры результата? Скорее всего нет - для этого понадобится анализировать внутреннюю структуру генератора а она доволвьно не простая(так как он сам написано на ClojureScript). Однако мы можем придумать некотрую систему определения структуры данных по которой мы сможем получать и функцию-генератор и функцию-валидатор. И давайте сделаем API похожим на `React.PropTypes` - ведь все мы так любим `React` =)









