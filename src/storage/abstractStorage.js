/*
 * GNU General Public License, Version 3.0
 *
 * Copyright (c) 2019 Taipa Xu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

class AbstractStorage {
    constructor() {
        if (new.target === AbstractStorage) {
            throw new TypeError('Abstract Class can not be initialized directly!');
        }
    }

    get(key) {

    }

    set(data) {

    }

    clear(key) {
        const value = {};
        value[key] = null;

        return this.set(value);
    }
}

export default AbstractStorage;
