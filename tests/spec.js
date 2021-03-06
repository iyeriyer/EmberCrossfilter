describe('Ember Crossfilter', function() {

    var controller;

    beforeEach(function() {

        controller = Ember.ArrayController.extend(EmberCrossfilter, {

            cutenessThreshold: 9,

            init: function() {
                Ember.set(this, 'content', [
                    { id: 1, name: 'Cecil', age: 4, colours: ['black', 'white', 'beige'], country: ['Russia'], cuteness: 11 },
                    { id: 2, name: 'Boris', age: 9, colours: ['black', 'white'], country: ['Italy'], cuteness: 5 },
                    { id: 3, name: 'Irina', age: 6, colours: ['ginger', 'beige'], country: ['Britain', 'Russia'], cuteness: 6 },
                    { id: 4, name: 'Jimmy', age: 12, colours: ['black'], country: ['Iran'], cuteness: 3 },
                    { id: 5, name: 'Masha', age: 4, colours: ['brown', 'black', 'beige'], country: ['Brazil'], cuteness: 14 },
                    { id: 6, name: 'Gorge', age: 6, colours: ['blue', 'grey'], country: ['Iran'], cuteness: 7 },
                    { id: 7, name: 'Milly', age: 7, colours: ['black', 'white', 'ginger'], country: ['Russia', 'Britain', 'Spain'], cuteness: 8 },
                    { id: 8, name: 'Honey', age: 7, colours: ['white'], country: 'Spain', cuteness: 12 },
                    { id: 9, name: 'Simon', age: 15, colours: ['black', 'white', 'grey'], country: ['Britain', 'Russia'], cuteness: 5 },
                    { id: 10, name: 'Julia', age: 11, colours: ['black', 'grey', 'ginger'], country: ['Russia'], cuteness: 13 }
                ]);
                this._super();
            },

            filterMap: {
                colour:         { property: 'colours', dimension: 'colour', method: 'filterOr' },
                country:        { property: 'country', dimension: 'country', method: 'filterAnd' },
                minAge:         { property: 'age', dimension: 'age', method: 'filterRangeMin' },
                maxAge:         { property: 'age', dimension: 'age', method: 'filterRangeMax' },
                name:           { property: 'name', dimension: 'name', method: 'filterExact' },
                partialName:    { property: 'name', dimension: 'nameRegexp', method: 'filterFunction' },
                isCute:         { property: 'cuteness', dimension: 'cuteness', method: 'filterFunction' }
            },

            sort: { sortProperty: 'name', isAscending: true },

            _applyIsCute: function(dimension) {
                return dimension > this.cutenessThreshold;
            }

        }).create();

    });

    describe('Generic', function() {

        it('Can set the content array on the controller.', function() {
            expect(Ember.get(controller, 'content.length')).toEqual(10);
        });

        it('Can find the `filterMap` defined on the controller.', function() {
            expect(Ember.get(controller, 'filterMap')).toBeDefined();
        });

    });

    describe('Helpers', function() {

        it('Can determine highest value for cuteness.', function() {
            expect(controller.top('isCute')['cuteness']).toEqual(14);
        });

        it('Can determine lowest value for age.', function() {
            expect(controller.bottom('minAge')['age']).toEqual(4);
        });

    });

    describe('Internals (Private Methods)', function() {

        it('Can apply default dimension.', function() {
            controller._applyContentChanges();
            expect(Ember.get(controller, 'content.length')).toEqual(10);
        });

        it('Can apply a specified dimension.', function() {
            var map = controller.filterMap.name;
            map.value = 'Boris';
            controller._updateContent(map);
            expect(Ember.get(controller, 'content.length')).toEqual(1);
        });

        it('Can sort content ascending by name.', function() {
            controller._sortedContent(Ember.get(controller, 'content'), 'name', true);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Boris');
        });

        it('Can sort content descending by name.', function() {
            controller._sortedContent(Ember.get(controller, 'content'), 'name', false);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Simon');
        });

    });

    describe('Crossfilter', function() {

        it('Can define the necessary dimensions.', function() {
            expect(Ember.get(controller, '_dimensionDefault')).toBeDefined();
            expect(Ember.get(controller, '_dimensionColour')).toBeDefined();
            expect(Ember.get(controller, '_dimensionAge')).toBeDefined();
            expect(Ember.get(controller, '_dimensionName')).toBeDefined();
            expect(Ember.get(controller, '_dimensionCuteness')).toBeDefined();
        });

        it('Can create a valid Crossfilter.', function() {
            expect(Ember.get(controller, '_crossfilter')).toBeDefined();
            expect(Ember.get(controller, '_crossfilter') instanceof Object).toBeTruthy();
        });

        it('Can filter content with filterExact.', function() {
            controller.addFilter('name', 'Boris');
            expect(Ember.get(controller, 'content.length')).toEqual(1);
        });

        it('Can filter content with filterInArray.', function() {
            controller.addFilter('colour', 'black');
            expect(Ember.get(controller, 'content.length')).toEqual(7);
        });

        it('Can filter content with filterFunction.', function() {
            controller.addFilter('isCute', true);
            expect(Ember.get(controller, 'content.length')).toEqual(4);
        });

        it('Can filter content with filterRangeMin.', function() {
            controller.addFilter('minAge', 5);
            expect(Ember.get(controller, 'content.length')).toEqual(8);
        });

        it('Can filter content with filterRangeMax.', function() {
            controller.addFilter('maxAge', 8);
            expect(Ember.get(controller, 'content.length')).toEqual(6);
        });

    });

    describe('Active Filters', function() {

        it('Can determine that the minAge filter is active.', function() {
            controller.addFilter('minAge', 4);
            expect(Ember.get(controller, 'filterMap.minAge.active')).toEqual(true);
        });

        it('Can determine that the colours are active.', function() {
            controller.addFilter('colour', 'black');
            expect(Ember.get(controller, 'filterMap.colour.active')).toEqual(['black']);

            controller.addFilter('colour', 'white');
            expect(Ember.get(controller, 'filterMap.colour.active')).toEqual(['black', 'white']);
        });

        it('Can determine that the colours are inactive.', function() {
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'white');
            controller.addFilter('colour', 'ginger');
            controller.removeFilter('colour', 'white');
            expect(Ember.get(controller, 'filterMap.colour.active')).toEqual(['black', 'ginger']);
        });

        it('Can determine that the name filter is not active.', function() {
            controller.addFilter('colour', 'black');
            expect(Ember.get(controller, 'filterMap.name.active')).toEqual(false);
        });

        it('Can determine that the many filters are active.', function() {
            controller.addFilter('name', 'Cecil');
            controller.addFilter('minAge', 7);
            expect(Ember.get(controller, 'filterMap.name.active')).toEqual(true);
            expect(Ember.get(controller, 'filterMap.minAge.active')).toEqual(true);
        });

        it('Can determine that no filters are active once cleared all.', function() {
            controller.addFilter('name', 'Cecil');
            controller.addFilter('minAge', 7);
            controller.send('clearAllFilters');
            expect(Ember.get(controller, 'filterMap.name.active')).toEqual(false);
            expect(Ember.get(controller, 'filterMap.minAge.active')).toEqual(false);
        });

    });

    describe('Simple Filtering', function() {

        it('Can add composite filters.', function() {
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'white');
            expect(Ember.get(controller, 'content.length')).toEqual(8);
            expect(Ember.get(controller, 'filterMap.colour.active')).toEqual(['black', 'white']);
        });

        it('Can remove composite filters.', function() {
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'white');
            controller.removeFilter('colour', 'black');
            expect(Ember.get(controller, 'content.length')).toEqual(5);
            expect(Ember.get(controller, 'filterMap.colour.active')).toEqual(['white']);
        });

        it('Can remove the name filter.', function() {
            controller.addFilter('name', 'Boris');
            controller.addFilter('minAge', 6);
            controller.removeFilter('name');
            expect(Ember.get(controller, 'content.length')).toEqual(8);
        });

        it('Can remove the minAge filter.', function() {
            controller.addFilter('name', 'Boris');
            controller.addFilter('minAge', 100);
            controller.removeFilter('minAge');
            expect(Ember.get(controller, 'content.length')).toEqual(1);
        });

        it('Can clear all of the filtering.', function() {
            controller.addFilter('name', 'Boris');
            controller.addFilter('maxAge', 8);
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'white');
            controller.send('clearAllFilters');
            expect(Ember.get(controller, 'content.length')).toEqual(10);
        });

    });

    describe('Boolean Filtering', function() {

        it('Can set singular items using the AND operator.', function() {
            controller.addFilter('country', 'Britain');
            expect(Ember.get(controller, 'content.length')).toEqual(3);
        });

        it('Can set multiple items using the AND operator.', function() {
            controller.addFilter('country', 'Britain');
            controller.addFilter('country', 'Russia');
            expect(Ember.get(controller, 'content.length')).toEqual(3);
        });

        it('Can set multiple items using the AND operator with remove.', function() {
            controller.addFilter('country', 'Britain');
            controller.addFilter('country', 'Russia');
            controller.removeFilter('country', 'Russia');
            expect(Ember.get(controller, 'content.length')).toEqual(3);
        });

        it('Can set singular items using the OR operator.', function() {
            controller.addFilter('colour', 'grey');
            expect(Ember.get(controller, 'content.length')).toEqual(3);
        });

        it('Can set multiple items using the OR operator.', function() {
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'grey');
            expect(Ember.get(controller, 'content.length')).toEqual(8);
        });

        it('Can set multiple items using the OR operator with remove.', function() {
            controller.addFilter('colour', 'black');
            controller.addFilter('colour', 'grey');
            controller.removeFilter('colour', 'black');
            expect(Ember.get(controller, 'content.length')).toEqual(3);
        });

    });

    describe('Adding', function() {

        it('Can add one record to an active Crossfilter', function() {
            controller.send('addRecord', { name: 'Adam' });
            expect(Ember.get(controller, 'content.length')).toEqual(11);
        });

        it('Can add many records using `addRecords` to an active Crossfilter', function() {
            controller.send('addRecords', [{ name: 'Adam' }, { name: 'Baki' }]);
            expect(Ember.get(controller, 'content.length')).toEqual(12);
        });

        it('Can delete one record from an active Crossfilter', function() {
            controller.send('addRecord', { id: 50, name: 'Gosia' });
            controller.send('addRecord', { id: 51, name: 'Noemi' });
            controller.send('deleteRecord', { id: 50, name: 'Gosia' });
            expect(Ember.get(controller, 'content.length')).toEqual(11);
        });

        it('Can delete many records using `deleteRecords` from an active Crossfilter', function() {
            controller.send('addRecord', { id: 11, name: 'Adam' });
            controller.send('addRecord', { id: 12, name: 'Baki' });
            controller.send('addRecord', { id: 13, name: 'Gosia' });
            controller.send('addRecord', { id: 14, name: 'Noemi' });
            expect(Ember.get(controller, 'content.length')).toEqual(14);
            controller.send('deleteRecord', { id: 2, name: 'Baki' });
            expect(Ember.get(controller, 'content.length')).toEqual(13);
        });

    });

    describe('Sorting', function() {

        it('Can sort content ascending by name.', function() {
            controller.send('sortContent', 'name', true);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Boris');
        });

        it('Can sort content descending by name.', function() {
            controller.send('sortContent', 'name', false);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Simon');
        });

        it('Can sort content ascending by cuteness level.', function() {
            controller.send('sortContent', 'cuteness', true);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Jimmy');
        });

        it('Can sort content descending by cuteness level.', function() {
            controller.send('sortContent', 'cuteness', false);
            expect(Ember.get(controller, 'content.firstObject.name')).toEqual('Masha');
        });

    });

});