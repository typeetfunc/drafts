"use strict";
exports.__esModule = true;
function create(as) {
    return new Vector(as);
}
var Vector = (function () {
    function Vector(value) {
        this.value = value;
    }
    Vector.prototype.append = function (vector) {
        return new Vector(this.value.concat(vector.value));
    };
    Vector.prototype.zip = function (vector) {
        return new Vector(this.value.map(function (a, i) { return [a, vector.value[i]]; }));
    };
    Vector.prototype.inspect = function () {
        return this.toString();
    };
    Vector.prototype.toString = function () {
        return "Vector(" + JSON.stringify(this.value) + ")";
    };
    return Vector;
}());
Vector.create = create;
// v1 :: Vector<_1, number>
var v1 = Vector.create([1]);
// v2 :: Vector<_2, number>
var v2 = Vector.create([2, 3]);
// v3 :: Vector<_3, number>
var v3 = v1.append(v2);
// v3.zip(v2) // error 
