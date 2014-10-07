var $, UI, Util;

UI = require('../../../src/ui');

Util = require('../../../src/util');

$ = Util.$;

describe('UI.Filter', function() {
    var element, plugin, sandbox;
    plugin = null;
    element = null;
    sandbox = null;
    beforeEach(function() {
        element = $('<div />')[0];
        plugin = new UI.Filter({
            filterElement: element
        });
        return sandbox = sinon.sandbox.create();
    });
    afterEach(function() {
        plugin.destroy();
        return sandbox.restore();
    });
    describe("default configuration", function() {
        it("should have a default annotation filter", function() {
            assert.equal(plugin.filters.length, 1);
            return assert.equal(plugin.filters[0].property, "text");
        });
        return it("should append the toolbar to the @options.appendTo selector", function() {
            var parent;
            parent = $(plugin.options.appendTo);
            return assert.equal(plugin.element.parent()[0], parent[0]);
        });
    });
    describe("addFilter", function() {
        var filter;
        filter = null;
        beforeEach(function() {
            plugin.filters = [];
            filter = {
                label: 'Tag',
                property: 'tags'
            };
            return plugin.addFilter(filter);
        });
        it("should add a filter object to Filter#plugins", function() {
            return assert.ok(plugin.filters[0]);
        });
        it("should append the html to Filter#toolbar", function() {
            filter = plugin.filters[0];
            return assert.equal(filter.element[0], plugin.element.find('#annotator-filter-tags').parent()[0]);
        });
        it("should store the filter in the elements data store under 'filter'", function() {
            filter = plugin.filters[0];
            return assert.equal(filter.element.data('filter'), filter);
        });
        return it("should not add a filter for a property that has already been loaded", function() {
            plugin.addFilter({
                label: 'Tag',
                property: 'tags'
            });
            return assert.lengthOf(plugin.filters, 1);
        });
    });
    describe("updateFilter", function() {
        var annotations, filter;
        filter = null;
        annotations = null;
        beforeEach(function() {
            filter = {
                id: 'text',
                label: 'Annotation',
                property: 'text',
                element: $('<span><input value="ca" /></span>'),
                annotations: [],
                isFiltered: function(value, text) {
                    return text.indexOf('ca') !== -1;
                }
            };
            annotations = [
                {
                    text: 'cat'
                }, {
                    text: 'dog'
                }, {
                    text: 'car'
                }
            ];
            plugin.filters = {
                'text': filter
            };
            plugin.highlights = {
                map: function() {
                    return annotations;
                }
            };
            sandbox.stub(plugin, 'updateHighlights');
            sandbox.stub(plugin, 'resetHighlights');
            return sandbox.stub(plugin, 'filterHighlights');
        });
        it("should call Filter#updateHighlights()", function() {
            plugin.updateFilter(filter);
            return assert(plugin.updateHighlights.calledOnce);
        });
        it("should call Filter#resetHighlights()", function() {
            plugin.updateFilter(filter);
            return assert(plugin.resetHighlights.calledOnce);
        });
        it("should filter the cat and car annotations", function() {
            plugin.updateFilter(filter);
            return assert.deepEqual(filter.annotations, [annotations[0], annotations[2]]);
        });
        it("should call Filter#filterHighlights()", function() {
            plugin.updateFilter(filter);
            return assert(plugin.filterHighlights.calledOnce);
        });
        return it("should NOT call Filter#filterHighlights() if there is no input", function() {
            filter.element.find('input').val('');
            plugin.updateFilter(filter);
            return assert.isFalse(plugin.filterHighlights.called);
        });
    });
    describe("filterHighlights", function() {
        var div;
        div = null;
        beforeEach(function() {
            var match;
            plugin.highlights = $('<span /><span /><span /><span /><span />');
            // This annotation appears in both filters
            match = {
                _local: {
                    highlights: [plugin.highlights[1]]
                }
            };
            plugin.filters = [
                {
                    annotations: [
                        {
                            _local: {
                                highlights: [plugin.highlights[0]]
                            }
                        }, match
                    ]
                }, {
                    annotations: [
                        {
                            _local: {
                                highlights: [plugin.highlights[4]]
                            }
                        }, match, {
                            _local: {
                                highlights: [plugin.highlights[2]]
                            }
                        }
                    ]
                }
            ];
            return div = $('<div>').append(plugin.highlights);
        });
        it("should hide all highlights not whitelisted by _every_ filter", function() {
            plugin.filterHighlights();
            // Only index 1 should remain
            return assert.lengthOf(div.find('.' + plugin.classes.hl.hide), 4);
        });
        it("should hide all highlights not whitelisted by _every_ filter if every filter is active", function() {
            plugin.filters[1].annotations = [];
            plugin.filterHighlights();
            return assert.lengthOf(div.find('.' + plugin.classes.hl.hide), 3);
        });
        return it("should hide all highlights not whitelisted if only one filter", function() {
            plugin.filters = plugin.filters.slice(0, 1);
            plugin.filterHighlights();
            return assert.lengthOf(div.find('.' + plugin.classes.hl.hide), 3);
        });
    });
    describe("resetHighlights", function() {
        return it("should remove the filter-hide class from all highlights", function() {
            plugin.highlights = $('<span /><span /><span />').addClass(plugin.classes.hl.hide);
            plugin.resetHighlights();
            return assert.lengthOf(plugin.highlights.filter('.' + plugin.classes.hl.hide), 0);
        });
    });
    return describe("group: filter input actions", function() {
        describe("_onFilterFocus", function() {
            return it("should add an active class to the element", function() {
                plugin._onFilterFocus({
                    target: plugin.filter.find('input')[0]
                });
                return assert.isTrue(plugin.filter.hasClass(plugin.classes.active));
            });
        });
        describe("_onFilterBlur", function() {
            it("should remove the active class from the element", function() {
                plugin.filter.addClass(plugin.classes.active);
                plugin._onFilterBlur({
                    target: plugin.filter.find('input')[0]
                });
                return assert.isFalse(plugin.filter.hasClass(plugin.classes.active));
            });
            return it("should NOT remove the active class from the element if it has a value", function() {
                plugin.filter.addClass(plugin.classes.active);
                plugin._onFilterBlur({
                    target: plugin.filter.find('input').val('filtered')[0]
                });
                return assert.isTrue(plugin.filter.hasClass(plugin.classes.active));
            });
        });
        describe("_onFilterKeyup", function() {
            beforeEach(function() {
                plugin.filters = [
                    {
                        label: 'My Filter'
                    }
                ];
                return sandbox.stub(plugin, 'updateFilter');
            });
            it("should call Filter#updateFilter() with the relevant filter", function() {
                plugin.filter.data('filter', plugin.filters[0]);
                plugin._onFilterKeyup({
                    target: plugin.filter.find('input')[0]
                }, $);
                return assert.isTrue(plugin.updateFilter.calledWith(plugin.filters[0]));
            });
            return it("should NOT call Filter#updateFilter() if no filter is found", function() {
                plugin._onFilterKeyup({
                    target: plugin.filter.find('input')[0]
                });
                return assert.isFalse(plugin.updateFilter.called);
            });
        });
        describe("navigation", function() {
            var annotation1, annotation2, annotation3, element1, element2, element3;
            element1 = null;
            element2 = null;
            element3 = null;
            annotation1 = null;
            annotation2 = null;
            annotation3 = null;
            beforeEach(function() {
                element1 = $('<span />');
                annotation1 = {
                    text: 'annotation1',
                    _local: {
                        highlights: [element1[0]]
                    }
                };
                element1.data('annotation', annotation1);
                element2 = $('<span />');
                annotation2 = {
                    text: 'annotation2',
                    _local: {
                        highlights: [element2[0]]
                    }
                };
                element2.data('annotation', annotation2);
                element3 = $('<span />');
                annotation3 = {
                    text: 'annotation3',
                    _local: {
                        highlights: [element3[0]]
                    }
                };
                element3.data('annotation', annotation3);
                plugin.highlights = $([element1[0], element2[0], element3[0]]);
                return sandbox.spy(plugin, '_scrollToHighlight');
            });
            describe("_onNextClick", function() {
                it("should advance to the next element", function() {
                    element2.addClass(plugin.classes.hl.active);
                    plugin._onNextClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
                });
                it("should loop back to the start once it gets to the end", function() {
                    element3.addClass(plugin.classes.hl.active);
                    plugin._onNextClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
                });
                it("should use the first element if there is no current element", function() {
                    plugin._onNextClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
                });
                it("should only navigate through non hidden elements", function() {
                    element1.addClass(plugin.classes.hl.active);
                    element2.addClass(plugin.classes.hl.hide);
                    plugin._onNextClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
                });
                return it("should do nothing if there are no annotations", function() {
                    plugin.highlights = $();
                    plugin._onNextClick();
                    return assert.isFalse(plugin._scrollToHighlight.called);
                });
            });
            return describe("_onPreviousClick", function() {
                it("should advance to the previous element", function() {
                    element3.addClass(plugin.classes.hl.active);
                    plugin._onPreviousClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element2[0]]));
                });
                it("should loop to the end once it gets to the beginning", function() {
                    element1.addClass(plugin.classes.hl.active);
                    plugin._onPreviousClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
                });
                it("should use the last element if there is no current element", function() {
                    plugin._onPreviousClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element3[0]]));
                });
                it("should only navigate through non hidden elements", function() {
                    element3.addClass(plugin.classes.hl.active);
                    element2.addClass(plugin.classes.hl.hide);
                    plugin._onPreviousClick();
                    return assert.isTrue(plugin._scrollToHighlight.calledWith([element1[0]]));
                });
                return it("should do nothing if there are no annotations", function() {
                    plugin.highlights = $();
                    plugin._onPreviousClick();
                    return assert.isFalse(plugin._scrollToHighlight.called);
                });
            });
        });
        describe("_scrollToHighlight", function() {
            var mockjQuery;
            mockjQuery = null;
            beforeEach(function() {
                plugin.highlights = $();
                mockjQuery = {
                    addClass: sandbox.spy(),
                    animate: sandbox.spy(),
                    offset: sandbox.stub().returns({
                        top: 0
                    })
                };
                sandbox.spy(plugin.highlights, 'removeClass');
                return sandbox.stub($.prototype, 'init').returns(mockjQuery);
            });
            afterEach(function() {
                return $.prototype.init.restore();
            });
            it("should remove active class from currently active element", function() {
                plugin._scrollToHighlight({});
                return assert.isTrue(plugin.highlights.removeClass.calledWith(plugin.classes.hl.active));
            });
            it("should add active class to provided elements", function() {
                plugin._scrollToHighlight({});
                return assert.isTrue(mockjQuery.addClass.calledWith(plugin.classes.hl.active));
            });
            return it("should animate the scrollbar to the highlight offset", function() {
                plugin._scrollToHighlight({});
                assert(mockjQuery.offset.calledOnce);
                return assert(mockjQuery.animate.calledOnce);
            });
        });
        return describe("_onClearClick", function() {
            var mockjQuery;
            mockjQuery = null;
            beforeEach(function() {
                mockjQuery = {};
                mockjQuery.val = sandbox.stub().returns(mockjQuery);
                mockjQuery.prev = sandbox.stub().returns(mockjQuery);
                mockjQuery.keyup = sandbox.stub().returns(mockjQuery);
                mockjQuery.blur = sandbox.stub().returns(mockjQuery);
                sandbox.stub($.prototype, 'init').returns(mockjQuery);
                return plugin._onClearClick({
                    target: {}
                });
            });
            afterEach(function() {
                return $.prototype.init.restore();
            });
            it("should clear the input", function() {
                return assert.isTrue(mockjQuery.val.calledWith(''));
            });
            it("should trigger the blur event", function() {
                return assert(mockjQuery.blur.calledOnce);
            });
            return it("should trigger the keyup event", function() {
                return assert(mockjQuery.keyup.calledOnce);
            });
        });
    });
});