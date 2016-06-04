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
потренируемся
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
получилось по аккуратнее имхо, можно еще чуть побаловатся и заменить спреды на каррированный merge - чтоб все понимали что мы реально функциональные ребята!
заменим
```Javascript
slider => ({...slider, ...}),
```
на 
```Javascript
merge(__, pick(['from', 'to', 'left', 'right'], action.payload))
// вернет функцию одного аргумента которая будет мержить аттрибуты этого аргумента с тем что ей передали`
```
Получается следующее:
```Javascript
const setProps = (state, action) =>  over(
	lensProp('rangeSlider'),
	merge(__, pick(['from', 'to', 'left', 'right'], action.payload)),
	state
)
```

Получается очень локанично - однако лаконичность это не главное. Главное это композируемость.
Линзы это пример отлично композируемой абстракции.

А давайте теперь сделаем линзу для работы с аттрибутом from у rangeSlider
Вынесем линзу rangeSlider в переменную
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
[Последний пример в Ramda REPL](http://goo.gl/qsW5Ln)
