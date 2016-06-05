## Начнем с простого

```Javascript
const setProps = (state, action) => ({
	...state,
	rangeSlider: {
		...state.rangeSlider,
		...pick(['from', 'to', 'left', 'right'], action.payload)
	}
})
```
Выше пример типичного несложного редусера. Довольно многословно не правда ли?
В чем собственно проблема иммутабельных изменений?
Чтобы установить значение вглубь структуры нам надо сначала полностью разобрать ее
 и потом собрать по новой с новым значением.
Это очень очень многословно - сравните запись вверху и обычное мутабельное присваивание:
```Javascript
Object.assign(state.rangeSlider, pick(['from', 'to', 'left', 'right'], action.payload))
```
То есть переходя от мутабельных структур к иммутабельным мы теряем в лаконичности
 и читабельности кода - естественно иммутабельные ребята не могли этого допустить и придумали линзы
Что есть линза? Было замечено что для того чтобы иммутабельно установить значение необходимо знать
 как его прочитать - как до него добратся.
Давайте тогда хранить функции для чтения и установки значения вместе в одной сущности,
 и давайте назовем это линзой - звучит то ведь круто!
Таким образом линза состоит из:
 - getter - функции для получения значения
 - setter - функции для установки значения(она обязательно должна быть чистой и выполнять установку иммутабельно!)

Чтобы создавать линзы мы будем использовать функцию `lens` из библиотеки [ramda](http://ramdajs.com/0.21.0/docs/#lens)
Первый ее аргумент - getter, второй - setter
Простой пример - определение линзы lensProp - для аттрибута обьекта
```Javascript
const lensProp = prop => lens(
	obj => obj[prop], // getter - получаем свойство
	(newVal, obj) => ({...obj, [prop]: newVal}) // setter ставим свойство иммутабельно 
)
```
Что можно сделать с линзой - есть три главный операции
 - view - подсмотреть по линзе - первый аргумент линза, второй данные в которых надо подсмореть
```Javascript
const a = {key: 2},
	val = view(lensProp('key'), a); // val - 2
```

 - set - установить данные по линзе - первый аргумент линза, затем значение которое надо установить, затем данные куда установить значение
```Javascript
const a = {key: 2},
	 newA = set(lensProp('key'), 4, a); // newA - {key: 4}
```

Хм, чего то нехватает...
 - А давайте еще введем операцию которую назовем over - вытащить через view по линзе значение, применить к нему некотрую функцию и установить его обратно

```Javascript
const over = (someLens, func, data) => {
	const val = view(someLens, data)
	const newVal = func(val)

	return set(someLens, newVal)
};
```

Потренируемся:
```Javascript
const a = {key: 2},
	changedA = over(lensProp('key'), val => val + 1, a) // changedA - {key: 3}
```

Ну вроде все есть - теперь вернемся к примеру: напишем наш редусер используя lensProp:
```Javascript
const setProps = (state, action) =>  over(
	lensProp('rangeSlider'),
	slider => ({...slider, ...pick(['from', 'to', 'left', 'right'], action.payload)}),
	state
)
```
Получается очень лаконично - однако лаконичность это не главное. Главное это композируемость.
Линзы это пример отлично композируемой абстракции.

А давайте теперь сделаем линзу для работы с аттрибутом from у rangeSlider
Вынесем линзу для работы с rangeSlider в переменную
```Javascript
const lensRangeSlider = lensProp('rangeSlider');
```
Как можно определить линзу для работы с аттрибутом from у любого обьекта?
правильно 
```Javascript
const lensFrom = lensProp('from')
```
И теперь магия! чтобы получить линзу для from у rangeSlider нужно просто скомпозировать две уже опеределнных нами линзы
```Javascript
const lensRangeSliderFrom = compose(
	lensRangeSlider,
	lensFrom
)
```
Пробуем
```Javascript
const state = {
	rangeSlider: {
		from: 3,
		to:4
	}
}

view(lensRangeSliderFrom, state) // 3
set(lensRangeSliderFrom, 5, state) 
/* {
	rangeSlider: {
		from: 5,
		to:4
	}
} */

over(lensRangeSliderFrom, val => val * 100, state) 
/* {
	rangeSlider: {
		from: 300,
		to:4
	}
} */
```
Не ну ведь огонь же?)
[Последний пример в Ramda REPL](http://goo.gl/qsW5Ln).

PS на самом деле такую линзу можно было бы определить используя встроенную в `ramda` функцию [lensPath](http://ramdajs.com/0.21.0/docs/#lensPath)
получилось бы просто:
```Javascript
const lensRangeSliderFrom = lensPath(['rangeSlider', 'from'])
```
Результат [тотже самый](http://goo.gl/acC417).
Но использовать библиотечные функции это так скучно xDD

## Примеры по страшнее

Представим что есть вот такая структурка:
```Javascript
const struct = {
    id: 2,
    description: 'Some cool thing',
    users: [
        {
            id: 1,
            fio: {
                name: 'Ivan'
            },
            familyMembers: [
                {
                    id: 5,
                    role: 'sister',
                    fio: {
                        name: 'Olga'
                    }
                }
            ]
        }
    ]
}
```
Есть некотрый обьект в котором есть юзеры с данными а у юзеров есть еще члены семьи у которых есть свои данные.
У нас есть задача - надо написать функцию которая будет обновлять имя юзера по айди. Давайте решим эту задачу с помощью линз.

Сначала нам нужно научится работать с ключем `users` в обьекте - воспользуемся функцией `lensProp` с которой мы познакомились ранее:
```Javascript
const lensUsers = lensProp('users')
```
Окей а дальше нам надо как то научится работать с конкретным юзером зная его айди.
Необходимо написать функцию которая будет получать айди юзера и возврашать линзу для этого юзера.
Как говорилось ранее линза состоит из двух функций - `getter` и `setter`. Давайте определим обе:
- `getter` должен получать на вход массив и возврашать юзера с определенным айди - напишем функцию которая создает такую функцию для определенного айди
```Javascript
const makeGetterById = id => array => array.find(item => item.id === id)
```

- `setter` должен получать на вход нового юзера и массив и устанавливать нового юзера на место старого с определенным айди
```Javascript
const makeSetterById = id => 
                (newItem, array) => 
                    array.map(item => item.id === id ? newItem : item)
```

Теперь определим саму функцию создающую линзу:
```Javascript
const lensById = id => lens(
    makeGetterById(id),
    makeSetterById(id)
)
```
Проверим работоспособность функции в [репле](http://goo.gl/fZr446):
```Javascript
const users = [{id:1, name: 'Ivan'}, {id:2, name: 'Oleg'}]

view(lensById(1), users) // {"id": 1, "name": "Ivan"}
set(lensById(2), {id:2, name: 'Olga'}, users) // [{"id": 1, "name": "Ivan"}, {"id": 2, "name": "Olga"}]
over(lensById(2), user => assoc('name', 'Fillip', user), users) // [{"id": 1, "name": "Ivan"}, {"id": 2, "name": "Fillip"}]
```

Работает! Продолжаем :) Осталось определить линзы для работы с ключами `fio` и `name` - снова воспользуемся lensProp
 ```Javascript
const lensFio = lensProp('fio')
const lensName = lensProp('name')
```

Осталось свести все это вместе - определим саму функцию которая по айди юзера будет создавать линзу для работы с его именем
 ```Javascript
const lensUserNameById = id => compose(
    lensUsers,
    lensById(id),
    lensFio,
    lensName
)
```
Выглядит довольно декларативно правда?)
Давайте попробуем функцию в деле:
 ```Javascript
view(lensUserNameById(1), struct) 
// -> "Ivan"
set(lensUserNameById(1), 'Petr', struct)
/* ->
{
    "description": "Some cool thing",
    "id": 2,
    "users": [
        {
            "familyMembers": [
                {
                    "fio": {
                        "name": "Olga"
                    },
                    "id": 5,
                    "role": "sister"
                }
            ],
            "fio": {
                "name": "Petr"
            },
            "id": 1
        }
    ]
}
*/

over(lensUserNameById(1), name => name + '!!!', struct)
/* ->
{
    "description": "Some cool thing",
    "id": 2,
    "users": [
        {
            "familyMembers": [
                {
                    "fio": {
                        "name": "Olga"
                    },
                    "id": 5,
                    "role": "sister"
                }
            ],
            "fio": {
                "name": "Ivan!!!"
            },
            "id": 1
        }
    ]
}
*/
```
[Пример в репле](http://goo.gl/kxSPgy)
Ура мы справились - мы молодцы! Казалось бы можно пойти отдыхать с чистой совестью и смотреть свежую серию любимого сериала.
Но вот незадача - нам _внезапно_ понадобилось уметь работать с именем у членов семьи юзера - чтоже делать? серия уже скачана :(

Давайте попробуем решить новую задачу по быстрому - максимально переиспользуя уже написанное.
Какие линзы нам нужны для этого?
- для начала линза для работы с ключом `users` - но она уже у нас определена - `lensUsers`.
- уже определенная линза для работы с юзером по айди - `lensById`.
- необходима линза для работы с `familyMembers`:
```Javascript
const lensFamilyMembers = lensProp('familyMembers')
```
- линза для работы с членом семьи по айди. Хм... Звучит знакомо не правда ли?
А не подойдет ли для этого ранее определенная `lensById`? Конечно же подойдет!
Ведь суть работы с членами семьи та же что и с юзерами - ищем по айди и заменяем по айди
- далее нам также нужны линзы для работы с `fio` и `name` - они уже были определены нами `lensFio` и `lensName` соответственно.

И так у нас есть все необходимые составляющие. Давайте определим функцию создающую нужную нам линзу:
```Javascript
const lensUserMemberFioNameById = (userId, memberId) => compose(
    lensUsers,
    lensById(userId),
    lensFamilyMembers,
    lensById(memberId),
    lensFio,
    lensName
)
```
Протестируем:
```Javascript
view(lensUserMemberFioNameById(1, 5), struct)
// -> "Olga"
set(lensUserMemberFioNameById(1, 5), 'Tanya', struct)
/* -> 
{
    "description": "Some cool thing",
    "id": 2,
    "users": [
        {
            "familyMembers": [
                {
                    "fio": {
                        "name": "Tanya"
                    },
                    "id": 5,
                    "role": "sister"
                }
            ],
            "fio": {
                "name": "Ivan"
            },
            "id": 1
        }
    ]
}
*/
over(lensUserMemberFioNameById(1, 5), name => name + '!!!', struct)
/* -> 
{
    "description": "Some cool thing",
    "id": 2,
    "users": [
        {
            "familyMembers": [
                {
                    "fio": {
                        "name": "Olga!!!"
                    },
                    "id": 5,
                    "role": "sister"
                }
            ],
            "fio": {
                "name": "Ivan"
            },
            "id": 1
        }
    ]
}
*/
```
Все работает как и ожидается - пример в [репле](http://goo.gl/DBtcZa).
И все хорошо но _внезапно_ нам может захотется работать с членами семьи не по айди а по роли(аттрибут `role`) - допустим она уникальна.
Мы можем легко написать линзу для работы со значением по `role`
- определяем функцию для создания геттера:
```Javascript
const makeGetterByRole = role => array => array.find(item => item.role === role)
```

- определяем функцию для создания сеттера:
```Javascript
const makeSetterByRole = role =>
                     (newItem, array) => 
                         array.map(item => item.role === role ? newItem : item)
```

Теперь определим саму функцию создающую линзу:
```Javascript
const lensByRole = role => lens(
    makeGetterByRole(role),
    makeSetterByRole(role)
)
```
Внимательный читатель может заметить что данная запись является почти полным копипастом определения `lensById`. 
Можем ли мы как то избавится от копипасты? Конечно! 
Давайте просто вынесем название аттрибута по которому определяется какой итем надо взять в аргументы функции:

- определяем функцию для создания геттера:
```Javascript
const makeGetterBy = (attr, val) => 
                                array => 
                                    array.find(item => item[attr] === val)
```

- определяем функцию для создания сеттера:
```Javascript
const makeSetterBy = (attr, val) =>
                        (newItem, array) => 
                            array.map(item => item[attr] === val ? newItem : item)
```

Теперь определим саму функцию создающую линзу:
```Javascript
const lensBy = attr => val => lens(
    makeGetterBy(attr, val),
    makeSetterBy(attr, val)
)
```
и при помощи нее переопределим `lensById` и `lensByRole`:
```Javascript
const lensById = lensBy('id')
const lensByRole = lensBy('role')
```

И теперь по аналогии с `lensUserMemberFioNameById` определим `lensUserMemberFioNameByRole`:
```Javascript
const lensUserMemberFioNameByRole = (userId, memberRole) => compose(
    lensUsers,
    lensById(userId),
    lensFamilyMembers,
    lensByRole(memberRole),
    lensFio,
    lensName
)
```
Протестируем:
```Javascript
view(lensUserMemberFioNameByRole(1, 'sister'), struct)
set(lensUserMemberFioNameByRole(1, 'sister'), 'Tanya', struct)
over(lensUserMemberFioNameByRole(1, 'sister'), name => name + '!!!', struct)
```
Результат будет точно такой же как в предыдущем примере - если не верите то [убедитесь сами](http://goo.gl/WtBfvj)
Видно что линзы позволяют писать легко переиспользуемый и композируемый код для работы с данными с возможностью простого рефакторинга.
На этом пожалуй все - на часах 3 ночи а уже довольно притомился от этого вашего фп :)

PS. Полный код примера в [репле](http://goo.gl/KloZWe)

## А теперь сами
Вспомним что у нас получилось в первом примере:
```Javascript
const setProps = (state, action) =>  over(
	lensProp('rangeSlider'),
	slider => ({...slider, ...pick(['from', 'to', 'left', 'right'], action.payload)}),
	state
)
```
Мы немного схитрили и использовали `over` чтобы смержить значение из `state` со значениями из `action.payload`.
Но ведь этот мерж также можно вынести в отдельную линзу - так как любую операцию с данными можно вынести в линзу.
Собственно предлагаю сделать это вам. Необходимо написать определение функции `lensByPick` которая будет работать так:
```Javascript
const data = {
    key: 'value',
    key1: 'value1',
    key2: 'value2',
}
view(lensByPick(['key1', 'key2']), data) // -> {key1: 'value1', key2: 'value2'}
set(lensByPick(['key1', 'key2']), {key1: 'newValue1', key2: 'newValue2', key3: 'newValue3'}, data)
/* ->
{
    key: 'value',
    key1: 'newValue1',
    key2: 'newValue2',
}
*/
over(lensByPick(['key1', 'key2']), obj => mapObjIndexed(val => val + '!!!', obj), data)
/* ->
{
    key: 'value',
    key1: 'value1!!!',
    key2: 'value2!!!',
}
*/
```
Начать можно отсюда - [заготовка для репла](http://goo.gl/Isyijp)

При помощи созданой вами линзы можно будет переписать наш пример вот так:
```Javascript
const lensRangeSliderByPick = keys => compose(
    lensProp('rangeSlider'),
    lensByPick(keys)
)

const setProps = (state, action) => set(
	lensRangeSliderByPick(['from', 'to', 'left', 'right']),
	action.payload,
	state
)
```