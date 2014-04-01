/**
 *  @module Matrix
 *  @namespace math
 *  @desc Represents a matrix
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create('glue/math/matrix', [
        'glue'
    ],
    function (Glue) {
        'use strict';
        var Sugar = Glue.sugar,
            module = function (width, height) {
                var mat = [],
                    n = Sugar.isDefined(width) ? width : 0,
                    m = Sugar.isDefined(height) ? height : 0,
                    i,
                    j,
                    set = function (x, y, value) {
                        mat[y * n + x] = value;
                    },
                    get = function (x, y) {
                        return mat[y * n + x];
                    };

                // initialize as identity matrix
                for (j = 0; j < m; ++j) {
                    for (i = 0; i < n; ++i) {
                        if (i === j) {
                            set(i, j, 1);
                        } else {
                            set(i, j, 0);
                        }
                    }
                }

                return {
                    /**
                     * Returns a string representation of the matrix (useful for debugging purposes)
                     */
                    stringify: function () {
                        var str = '',
                            row = '';
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                row += get(i, j) + '\t';
                            }
                            str += row + '\n';
                            row = '';
                        }
                        return str;
                    },
                    /**
                     * Get the value inside matrix
                     * @param {Number} x - x index
                     * @param {Number} y - y index
                     */
                    get: function (x, y) {
                        return get(x, y);
                    },
                    /**
                     * Set the value inside matrix
                     * @param {Number} x - x index
                     * @param {Number} y - y index
                     * @param {Number} value - new value
                     */
                    set: function (x, y, value) {
                        set(x, y, value);
                    },
                    /**
                     * Set the values inside matrix using an array
                     * If the matrix is 2x2 in size, then supplying an array with
                     * values [1, 2, 3, 4] will result in a matrix
                     * [1 2]
                     * [3 4]
                     * If the array has more elements than the matrix, the 
                     * rest of the array is ignored.
                     * @param {Array} array - array with Numbers
                     */
                    setValues: function (array) {
                        var l = Math.min(mat.length, array.length);
                        for (i = 0; i < l; ++i) {
                            mat[i] = array[i];
                        }
                        return this;
                    },
                    /**
                     * Get the matrix width
                     */
                    getWidth: function () {
                        return n;
                    },
                    /**
                     * Get the matrix height
                     */
                    getHeight: function () {
                        return m;
                    },
                    /**
                     * Iterate through matrix
                     */
                    iterate: function (callback) {
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                if (!Sugar.isFunction(callback)) {
                                    throw ('Please supply a callback function');
                                }
                                callback(i, j, get(i, j));
                            }
                        }
                    },
                    /**
                     * Transposes the current matrix
                     */
                    transpose: function () {
                        var newMat = [];
                        // reverse loop so m becomes n
                        for (i = 0; i < n; ++i) {
                            for (j = 0; j < m; ++j) {
                                newMat[i * m + j] = get(i, j);
                            }
                        }
                        // set new matrix
                        mat = newMat;
                        // swap width and height
                        m = [n, n = m][0];
                        return this;
                    },
                    /**
                     * Addition of another matrix
                     * @param {Matrix} matrix - matrix to add
                     */
                    add: function (matrix) {
                        if (m != matrix.getHeight() || n != matrix.getWidth()) {
                            throw 'Matrix sizes incorrect';
                        }
                        for (j = 0; j < m; ++j) {
                            for (i = 0; i < n; ++i) {
                                set(i, j, get(i, j) + matrix.get(i, j));
                            }
                        }
                        return this;
                    },
                    /**
                     * Multiply with another matrix
                     * If a new matrix C is the result of A * B = C
                     * then B is the current matrix and becomes C, A is the input matrix
                     * @param {Matrix} matrix - input matrix to multiply with
                     */
                    multiply: function (matrix) {
                        var newMat = [],
                            newWidth = n, // B.n
                            oldHeight = m, // B.m
                            newHeight = matrix.getHeight(), // A.m
                            oldWidth = matrix.getWidth(), // A.n
                            newValue = 0,
                            k;
                        if (oldHeight != oldWidth) {
                            throw 'Matrix sizes incorrect';
                        }

                        for (j = 0; j < newHeight; ++j) {
                            for (i = 0; i < newWidth; ++i) {
                                newValue = 0;
                                // loop through matrices
                                for (k = 0; k < oldWidth; ++k) {
                                    newValue += matrix.get(k, j) * get(i , k);
                                }
                                newMat[j * newWidth + i] = newValue;
                            }
                        }
                        // set to new matrix
                        mat = newMat;
                        // update matrix size
                        n = newWidth;
                        m = newHeight;
                        return this;
                    },
                    /**
                     * Returns a clone of the current matrix
                     */
                    clone: function () {
                        var newMatrix = module(n, m);
                        newMatrix.setValues(mat);
                        return newMatrix;
                    },
                    static: {
                        add: function (matrix1, matrix2) {
                            var matrix = matrix1.clone();
                            matrix.add(matrix2);
                            return matrix;
                        },
                        /**
                         * Multiply with 2 matrices
                         * Returns matric C if the multiplication is A * B = C
                         * @param {Matrix} matrix1 - matrix A
                         * @param {Matrix} matrix2 - matrix B
                         */
                        multiply: function (matrix1, matrix2) {
                            var matrix = matrix2.clone();
                            matrix.multiply(matrix1);
                            return matrix;
                        }
                    }
                };
            };
        return module;
    }
);