Всем привет, меня зовут Мельников Андрей и сегодня я хотел бы обсудить тему оценки и доказательства свойств программных решений.

В чем состоит задача программиста? Один из самых популярных ответов - предоставлять некотрое решение существующей проблемы(иногда решение может и не содержать какого либо кода). Неотемлимой частью предоставления решения является стадия анализа разработанного решения - в котором мы пытаемся понять что за решение мы получили, какие у него ограничения, область применения, на какие компромисы оно идет - на сколько хорошо оно решает изначальную проблему и сколько других проблем добавляет. На сегодняшний день большая часть анализа протекает в неформальных терминах - "Это ненадежное решение", "Это плохо читаемый код", "Плохо тестируется" и так далее. Для формального анализа мы в большинстве случаев используем различные виды тестов основанных на тест-кейсах.

Неформальный анализ нас сейчас не интересует так как он имеет больше отношение к философии и софистике нежели к точным наукам. Поэтому давайте сконцентрируемся на тестировании, взглянув на него с точки зрения точной науки то есть математики.

Математики так же как и программисты создают решения и анализируют их - возьмем для примера анализ функций(они ближе всего к програмам). Что по сути такое тест-кейс с точки зрения анализа функции? Это некотрая точка(координата) функции, а сам тест соотвественно анализ поведения функции в этой точке(причем точки обычно выбираются не случайно, а на разных участках с разным поведением функции - для этого обычно используется информация по покрытию кода). Исследования поведения функции в некотрых важных точках неотъемлимая часть математического анализа. Однако также математики уделяют много времени анализу свойств справедливых для любых точек(значений) - например [функция сложения ассоциативная, коммутативна итд](https://ru.wikipedia.org/wiki/%D0%A1%D0%BB%D0%BE%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_(%D0%BC%D0%B0%D1%82%D0%B5%D0%BC%D0%B0%D1%82%D0%B8%D0%BA%D0%B0).

Программы как и математические функции в большинстве случаев определены на очень большом числе значений(близком к бесконечному), однако по какой то причине мы редко интересуемся свойствами за пределами конкретных точек(тест-кейсов) - получается что мы можем быть уверены в определенном поведении наших программ только в некотром ограниченном наборе точек - что конечно никуда не годится. Так что же мы можем сделать?

Давайте посмотрим сначала на простой пример(взятый из математики), а потом перейдем к более жизненному примеру. Рассмотрим обыкновенное сложение(далее для описания тестов я буду использовать jasmine-образный синтаксис):

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
Возникает вопрос а надо было чтото писать или все уже как всегда написано до нас? Ответ - да, все уже написано. Данный подход называется property-based testing(а.к.a Quick-Check тесты, property тесты и даже proper тесты) появился в [хаскеле-коммьюнити](http://www.eecs.northwestern.edu/~robby/courses/395-495-2009-fall/quick.pdf). На сегодняшний его имплементации есть практически для всех языков и конечно же для Javascript. В примерах я буду использовать встроенный в [Jest](https://facebook.github.io/jest/) [testcheck-js](https://github.com/leebyron/testcheck-js) который на самом деле является лишь биндингом к [test.check написанному на ClojureScript](https://github.com/clojure/test.check). Наш пример с его использованием запишется так:

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

Note: дальше будет много кода написаного на коленке в течение короткого промежутка времени в качестве Proof of concept. Данный код представлен только для того чтобы показать некотрую идею а не быть готовым для реального применения.

Первое что приходит в голову - да сами значения меняются, но структура то остается прежней!
Следовательно мы можем ослабить свойство и проверять не на точное равенство, а на что структура остается прежней:

```javascript
function isSameShape(structFromBackend) {
  var structForFrontend = convertFrom(structFromBackend);
  var structForBackend = convertTo(structForFrontend)

  expect(checkFamilyStruct(structForBackend)).toBe(true);
}
```

Осталось только написать функцию `checkFamilyStruct` :)
Хм а если подумать? Вспомните ведь мы уже описывали структуру наших данных - в генераторе - мы описали и типы и различные ограничения для нашей структуры(в `mapFamily`). Можем ли мы как то переиспользовать создание нашего генератора для проверки структуры результата? Скорее всего нет - для этого понадобится анализировать внутреннюю структуру генератора, а она доволвьно не простая(так как он сам написан на `ClojureScript`).

Однако мы можем придумать некотрую систему определения структуры данных по которой мы сможем получать и функцию-генератор и функцию-валидатор. И давайте сделаем API похожим на `React.PropTypes` - ведь все мы так любим `React` =) Единственным новым методом будет `.invariant` который будет отвечает за преобразование генерируемой последовательности(вспоминаем метод `.map`). Использование нашего API должно выглядеть так:

```javascript
const makeFamilySpec = spec => spec.shape({
    type: spec.oneOf(['espoused', 'single', 'common_law_marriage']),
    members: spec.arrayOf(
        spec.shape({
            role: spec.oneOf(['sibling', 'child', 'parent', 'spouse']).isRequired,
            fio: spec.shape({
                firstname: spec.string,
                lastname: spec.string,
                middlename: spec.string
            }),
            dependant: spec.bool
        }).isRequired
    )
}).invariant(mapFamily);
```
Соотвественно теперь нам надо лишь определить обьект `spec` для валидатора и для генератора. Для валидации я буду использовать [expect](https://facebook.github.io/jest/docs/api.html#expectvalue) из `jest` просто потому что это единственное что было под рукой :) Очевидно что для валидации можно использовать любую библиотеку для проверки данных(получится даже проще), да и сам формат описания структуры может быть любым.

Для начала накидаем общую структуру API для валидатора:

```javascript
export const jestSpec = { // specJest просто некотрая обертка которая добавит все неообходимые методы
    string: specJest(actual => expect(isString(actual)).toBe(true)), // для примитивов проверяем просто типы
    bool: specJest(actual => expect(isBoolean(actual)).toBe(true)),
    oneOf: list => specJest(actual => expect(list).toContainEqual(actual)),
    shape: shape => specJest(actual => {
        expect(isPlainObject(actual)).toBe(true);
        keys(shape).forEach(key => { // для обьекта проверяем что все ключи соотвествуют описаниям
            shape[key](actual[key]);
        });
    }),
    arrayOf: itemSpec => specJest(actual => {
        expect(isArray(actual)).toBe(true);
        actual.forEach(item => itemSpec(item)); // для массива проверяем элементы которые содержатся в нем
    })
};
```

Теперь давайте сделаем тоже самое для генератора:

```javascript
export const genSpec = { // specGen просто некотрая обертка которая добавит все неообходимые методы
    string: specGen(gen.asciiString),
    bool: specGen(gen.boolean),
    oneOf: list => specGen(gen.returnOneOf(list)),
    shape: shape => specGen(gen.object(shape)),
    arrayOf: itemSpec => specGen(gen.array(itemSpec))
};
```

Далее необходимо реализовать сами обертки которые будут добавлять необходимые методы - большая часть кода там и для валидатора и для генератора будет общей - вынесем ее в функцию `makeSpecable`, которая будет принимать 2 функции(которые уже будет содержать логику специфичную для генератора или валидатора):
 - `makeNotRequired` - определит как сделать из того что нам передали необязательный генератор/валидатор.
  
  Ну здесь все довольно просто. Для валидатора:

```javascript
   check => actual => isUndefined(actual) || check(actual)
```
Для генератора:

```javascript
   generator => gen.oneOf([gen.undefined, generator])
```
 - `makeInvariant` - определит как для добавить ограничение по некотрой кастомной функции для генератора/валидатора

Для генератора мы такое уже делали - используем знакомый `.map`:

```javascript
   (generator, func) => gen.map(func, generator)
```

Хм а вот с валидатором все сложнее. Давайте вспомним что посути делает `mapFamily`? Приводит структуру к верному виду. А что она делает для структуры которая не содержит нарушений? Правильно - ничего, она никак ее не меняет. Следовательно мы можем сделать проверку - если `mapFamily` ничего не изменила, следовательно структура была верной:

```javascript
expect(mapFamily(familyStruct)).toEqual(familyStruct);
```

Вооружившись этой идеей напишем `makeInvariant` для валидатора:

```javascript
(check, func) => actual => {
    expect(func(actual)).toEqual(actual);
    check(actual);
}
```

Ну и теперь осталось написать только `makeSpecable` которая будет добавлять необходимые методы:

```javascript
const makeSpecable = (makeNotRequired, makeInvariant) => specable => {
    const notRequired = makeNotRequired(specable);
    notRequired.isRequired = specable;
    notRequired.invariant = func => makeInvariant(specable, func);
    return notRequired;
};
```
Проверяем:

```javascript
const checkFamilyStruct = makeFamilySpec(jestSpec);
const generatorFamilyStruct = makeFamilySpec(genSpec);

describe('convertFrom and convertTo properties', () => {
  check.it('convertFrom -> convertTo save original shape', [generatorFamilyStruct], structFromBackend => {
    const structForFrontend = convertFrom(structFromBackend);
    const structForBackend = convertTo(structForFrontend);
    checkFamilyStruct(structForBackend);
  });
});
```
Ура, заработало! Гист с полным кодом  https://gist.github.com/typeetfunc/ac4ed98d5014870c797ce138796f5cc4

Вообще идея иметь одно описание данных и по нему получать и валидаторы и генераторы придумана конечно же не мной.
Именно на этом базируется довольно новая технология - [clojure.spec](http://clojure.org/about/spec) - которая в свою очередь черпала вдохновение из [системы контрактов Racket](http://docs.racket-lang.org/guide/contracts.html).

Еще дальше идет проект [Automatic annotations](http://frenchy64.github.io/2016/08/07/automatic-annotations.html) для все той же `Clojure` - ребята предлагают динамически анализировать юнит-тесты вычислять по ним возможные ограничения на данные и далее использовать их как для compile-time проверок при помощи [core.typed](https://github.com/clojure/core.typed)(система опциональной типизации) так и для run-time проверок при помощи `clojure.spec`. Такое решение позволяет проверять простые ограничения статически - и получать мгновенный отклик, а сложные свойства проверять динамически при помощи генеративных тестов - что конечно более медленно, но зато без необходимости использовать сложные системы типов включающие [dependant](http://beust.com/weblog/2011/08/18/a-gentle-introduction-to-dependent-types/) и [refinement](http://goto.ucsd.edu/~pvekris/docs/pldi16.pdf) types. По моему мнению подобные гибридные подходы с использованием как средств статических проверок(системы gradual typing) так и динамических(property-based тесты) являются светлым будующем языков с динамической типизацией.

# Решение №2 - простое

Однако мы немного отвлеклись от темы. Нашей целью было доказать что `convertTo` функция обратная `convertFrom` - однако нам помешала простановка дефолтных значений. Можно было как то решить эту проблему не ослабляя требования к свойствам и без написания нового инструмента?

Да конечно мы можем просто вынести простановку дефолтных значений в отдельную функцию `setDefault` из `convertTo`, и тогда она станет удовлетворять исходному свойству.
Иногда начинающие разработчики(такие как я например) при возникновении проблемы сразу бросаются писать код который ее решает. Зачастую стоит сначала подумать "может проблему можно решить совсем на другом уровне?". Например изменить API модуля согласно тому какие гарантии нам предоставляют отдельные вызовы - как в нашем случае.

# В чем сложности?

Не смотря на очевидную пользу property-based тесты не имеют большой популярности среди разработчиков, несмотря на то что уже существует множество реализаций [почти для любого языка программирования](https://en.wikipedia.org/wiki/QuickCheck).

Причина в том что свойства пригодные для проверки таким способом очень трудно выделить в типичном продакшен коде. Но почему?

Во-первых разработчики не привыкли думать о свойствах которые предоставляет их решение - соотвественно мы проектируем и разрабатываем систему без опоры на какие либо свойства. TDD и BDD во много приучили нас думать и _разрабатывать_ отдельными сценариями - "если ввести A то вернется B" - то есть посути отдельными "точками". Очень сложно перейти от такого дискретного мышления к более непрерывному "свойство выполняется для любого A из некотрого множества".

Во-вторых, можно было заметить что в нашем примере исследуемые функции были чистыми(то есть без сайд-эффектов), однако большая часть фронтенд кода это функции с сайд-эффектами(начиная от походов в сеть кончая работой с глобальным состоянием). Функции с сайд-эффектами и просто то тестируются намного сложнее чистых функций, а понять какие они предоставляют свойства будет еще сложнее из-за их непредсказуемости. Есть способы позволяющие отделять сайд-эффекты от основного кода оставляя его чистым, однако это тема для отдельной большой статьи.

# Полезные ссылки

 - [Choosing properties for property-based testing](http://fsharpforfunandprofit.com/posts/property-based-testing-2/) - подробно разбираются множество практических кейсов для property-based тестирования(с примерами). Must have для тех кто хочет использовать данный подход на практике.
 - [JSverify](http://jsverify.github.io/) - еще одна реализация данного подхода на чистом Javascript. По возможности рекомендую использовать именно ее - так как ее намного проще отлаживать в отличии от `testcheck-js`(стектрейсы не уводят в бесконечность `ClojureScript` рантайма)
 - [Applying Property Based Testing to User Interfaces](https://github.com/omcljs/om/wiki/Applying-Property-Based-Testing-to-User-Interfaces) - хорошая статья о реальном применении property-based тестов для тестирования UI(на примере работы со стейтом пользователя - пример описан для библиотеки `Om`, но в целом те же практики можно использовать и для тестирования `Redux-based` приложений)

Напоследок хотелось бы сказать что property-based тестирование как и любые другие методы контроля поведения программ(статические типы, любое тестирование, верификация) приносят пользу даже в сам момент начала их применения так как разработчик начинает задумыватся о том как работает его код, какие свойства и гарантии он представляет и уже это позволяет выявить многие проблемы или просто прийти к лучшему решению c точки зрения архитектуры и API. Не бойтесь пытатся использовать новые практики для анализа своих программ - даже если вам не удастся их применить по каким то причинам, возможно вы начнете лучше понимать свой код.

Спасибо за внимание!

Возникшие вопросы можно задавать в комментариях или мне в твиттере - [@bracketsarrows](https://twitter.com/bracketsarrows)










