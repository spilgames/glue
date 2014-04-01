/**
 *  @desc Baseobject
 *  @copyright (C) SpilGames
 *  @license BSD 3-Clause License (see LICENSE file in project root)
 */
glue.module.create(
    [
        'glue',
        'glue/math/matrix'
    ],
    function (Glue, Matrix) {
        var Sugar = Glue.sugar;
        describe('modules.glue.math.matrix', function () {
            'use strict';

            it('Should be able to create a matrix', function () {
                var matrix = Matrix();
                expect(Sugar.isMatrix(matrix)).toBeTruthy;
            });

            it('Should be able to set a matrix of any size', function () {
                var matrix = Matrix(3, 2);
                // set using a matrix
                matrix.setValues([0, 1, 2, 3, 4, 5]);
                // set using x and y index
                matrix.set(0, 0, 123);
                expect(matrix.getWidth()).toEqual(3);
                expect(matrix.getHeight()).toEqual(2);
                expect(matrix.get(0, 0)).toEqual(123);
                expect(matrix.get(1, 0)).toEqual(1);
                expect(matrix.get(2, 0)).toEqual(2);
                expect(matrix.get(0, 1)).toEqual(3);
                expect(matrix.get(1, 1)).toEqual(4);
                expect(matrix.get(2, 1)).toEqual(5);
            });

            it('Should be able to transpose a matrix', function () {
                var matrix = Matrix(2, 2);
                matrix.setValues([1, 2, 3, 4]);
                matrix.transpose();
                expect(matrix.get(0, 0)).toEqual(1);
                expect(matrix.get(1, 0)).toEqual(3);
                expect(matrix.get(0, 1)).toEqual(2);
                expect(matrix.get(1, 1)).toEqual(4);
            });

            it('Should be able to add 2 matrices', function () {
                var A = Matrix(2, 2),
                    B = Matrix(2, 2);
                A.setValues([1, 2, 3, 4]);
                B.setValues([5, 6, 7, 8]);
                
                // A = A + B
                A.add(B);

                expect(A.get(0, 0)).toEqual(6);
                expect(A.get(1, 0)).toEqual(8);
                expect(A.get(0, 1)).toEqual(10);
                expect(A.get(1, 1)).toEqual(12);
            });

            it('Should be able to multiply 2 matrices', function () {
                var A = Matrix(2, 2),
                    B = Matrix(2, 2);
                A.setValues([1, 2, 3, 4]);
                B.setValues([5, 6, 7, 8]);

                // B = A * B
                // in other words, B will be assigned as the multiplication of A B
                B.multiply(A);

                expect(B.get(0, 0)).toEqual(19);
                expect(B.get(1, 0)).toEqual(22);
                expect(B.get(0, 1)).toEqual(43);
                expect(B.get(1, 1)).toEqual(50);
            });
            
            it('Should be able to multiply 2 matrices and return the result', function () {
                var A = Matrix(2, 2),
                    B = Matrix(2, 2),
                    C;
                A.setValues([1, 2, 3, 4]);
                B.setValues([5, 6, 7, 8]);

                // C = A * B
                C = A.static.multiply(A, B);

                expect(C.get(0, 0)).toEqual(19);
                expect(C.get(1, 0)).toEqual(22);
                expect(C.get(0, 1)).toEqual(43);
                expect(C.get(1, 1)).toEqual(50);
                expect(B.get(0, 0)).toEqual(5);
                expect(B.get(1, 0)).toEqual(6);
                expect(B.get(0, 1)).toEqual(7);
                expect(B.get(1, 1)).toEqual(8);
            });
            
            it('Should be able to clone a matrix', function () {
                var A = Matrix(2, 2),
                    B = Matrix(2, 2),
                    C;
                A.setValues([1, 2, 3, 4]);
                B.setValues([5, 6, 7, 8]);

                // for example, you want to preserve the state of B
                C = B.clone();
                B.multiply(A);

                expect(C.get(0, 0)).toEqual(5);
                expect(C.get(1, 0)).toEqual(6);
                expect(C.get(0, 1)).toEqual(7);
                expect(C.get(1, 1)).toEqual(8);
            });

        });
    }
);