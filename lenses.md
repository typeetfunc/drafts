```Javascript
const setProps = (state, action) => ({
	...state,
	rangeSlider: {
		...state.rangeSlider,
		...pick(['from', 'to', 'left', 'right'], action.payload)
	}
})
```
Вот твой пример в приличном виде)
В чем собственно проблема иммутабельных изменений? чтобы установить значние вглубь структуры нам надо полностью разобрать ее и потом собрать по новой.
Это очень очень многословно - сравни запись вверху и обычное
Object.assign(state.rangeSlider, pick(['from', 'to', 'left', 'right'], action.payload))
то есть переходя от мутабельных структур к иммутабельным мы теряем в лаконичности и читабельности кода - естественно иммутабельные ребята не могли этого допустить и придумали линзы
Что есть линза? Было замечено что для того чтобы иммутабельно установить значение необходимо знать как его прочитать - как до него добратся. Давайте тогда хранить функции для чтения и установки значения вместе в одной сущности, и давайте назовем это линзой - звучит то ведь круто!
Линза это функция которая принимает два аргумента getter - функция для получения значения, и setter - функция для установки значения(она обязательно должна быть чистой и выполнять установку иммутабельно!)
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

 - set - установить данные по линзе - перв арг линза, затем значение которое надо устновить, затем куда устновить
```Javascript
const a = {key: 2},
	 newA = set(lensProp('key'), 4, a); // newA - {key: 4}
```

хм и давайте еще введем операцию которую назовем over - вытащить через view по линзе значение, применить к нему некотрую функцию и установить его обратно
```Javascript
const over = (lenss, func, data) => {
	const val = view(lenss, data);
	const newVal = func(val);
	return set(lenss, newVal)
};
```
потренируемся
```Javascript
const a = {key: 2},
	changedA = over(lensProp('key'), val => val + 1, a) // changedA - {key: 3}
```
Ну вроде все есть - теперь вернемся к примеру
напишем наш редусер используя lensProp
```Javascript
const setProps = (state, action) =>  over(
	lensProp('rangeSlider'),
	slider => ({...slider, ...pick(['from', 'to', 'left', 'right'], action.payload)}),
	state
)
```	
получилось по аккуратнее имхо, но можно сделать еще лучше!
заменим
`slider => ({...slider, ...}),`
на 
`merge(pick(['from', 'to', 'left', 'right'], action.payload))// вернет функцию одного аргумента которая будет мержить аттрибуты этого аргумента с тем что ей передали`
```Javascript
const setProps = (state, action) =>  over(
	lensProp('rangeSlider'),
	merge(pick(['from', 'to', 'left', 'right'], action.payload)),
	state
)
```
Ну ладно скажите вы - "так конечно короче, но как то невпечатляет - можно чуть длинше написать зато не надо ничего учить"
Все так, но дело не только в лаконичности. Линзы это пример отлично композируемой абстракции

давайте теперь сделаем линзу для работы с аттрибутом from у rangeSlider
Вынесем линзу rangeSlider в переменную
```Javascriptconst lensRangeSlider = lensProp('rangeSlider');```
Как можно определить линзу для работы с аттрибутом from у любого обьекта?
правильно 
```Javascriptconst lensFrom = lensProp('from')```
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
		from: 5,
		to:4
	}
} */
```
Не ну ведь огонь же?)

